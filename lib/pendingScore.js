// lib/pendingScore.js
//
// Un invite qui termine une partie n'a pas de compte : son score ne peut pas
// etre ecrit en base (les policies RLS exigent auth.uid() = user_id). On le
// met de cote localement, et on l'ecrit des qu'une session apparait.
//
// POURQUOI localStorage ET PAS sessionStorage
// La connexion Google sort du site puis y revient : sessionStorage survit a
// cette navigation dans le meme onglet, mais pas si le retour se fait dans un
// autre onglet, ce qui arrive sur mobile. localStorage couvre les deux.
//
// Le score est conserve 24 h au maximum : au-dela, l'utilisateur a
// probablement oublie la partie, et lui attribuer un score surgi de nulle part
// serait deroutant.

const KEY = 'kf_pending_score'
const MAX_AGE_MS = 24 * 60 * 60 * 1000

// payload attendu :
// {
//   game:        'flag-quiz',        // cle utilisee par game_scores_log
//   score:       50657,              // points de la partie
//   mode:        'flag_quiz',        // cle utilisee par game_scores (facultatif)
//   bestStreak:  161,                // meilleure serie (facultatif)
//   correct:     275,                // bonnes reponses (facultatif)
//   played:      278,                // questions jouees (facultatif)
//   label:       'Flag Quiz',        // affichage dans l'invitation
// }
export function savePendingScore(payload) {
  if (typeof window === 'undefined') return
  if (!payload?.game || !payload?.score || payload.score <= 0) return
  try {
    window.localStorage.setItem(KEY, JSON.stringify({ ...payload, at: Date.now() }))
  } catch { /* mode prive, quota : on abandonne silencieusement */ }
}

export function readPendingScore() {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return null
    const data = JSON.parse(raw)
    if (!data?.game || !data?.score) return null
    if (Date.now() - (data.at || 0) > MAX_AGE_MS) { clearPendingScore(); return null }
    return data
  } catch { return null }
}

export function clearPendingScore() {
  if (typeof window === 'undefined') return
  try { window.localStorage.removeItem(KEY) } catch { /* ignore */ }
}

// Ecrit le score en attente pour l'utilisateur qui vient de se connecter.
// Retourne le payload ecrit, ou null si rien n'etait en attente.
//
// Les trois tables sont alimentees comme le ferait le jeu lui-meme :
//   game_scores_log  -> la partie, lue par le classement
//   game_scores      -> le meilleur score personnel
//   player_stats     -> les compteurs de profil
export async function flushPendingScore(supabase, userId) {
  const pending = readPendingScore()
  if (!pending || !userId) return null

  // On retire l'entree AVANT d'ecrire : si deux onglets se reveillent en meme
  // temps, un seul ecrira. Un score perdu vaut mieux qu'un score double.
  clearPendingScore()

  try {
    await supabase.from('game_scores_log').insert({
      user_id: userId,
      game: pending.game,
      score: pending.score,
      played_at: new Date(pending.at || Date.now()).toISOString(),
    })

    if (pending.mode) {
      const { data: existing } = await supabase
        .from('game_scores')
        .select('best_streak')
        .eq('user_id', userId).eq('mode', pending.mode)
        .maybeSingle()

      await supabase.from('game_scores').upsert({
        user_id: userId,
        mode: pending.mode,
        best_streak: Math.max(existing?.best_streak ?? 0, pending.score),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,mode' })
    }

    if (pending.correct != null || pending.bestStreak != null) {
      const { data: stats } = await supabase
        .from('player_stats')
        .select('games_played, flags_found, streak_best')
        .eq('user_id', userId).eq('game', pending.game)
        .maybeSingle()

      const row = {
        user_id: userId,
        game: pending.game,
        games_played: (stats?.games_played || 0) + 1,
        flags_found: (stats?.flags_found || 0) + (pending.correct || 0),
        streak_best: Math.max(stats?.streak_best || 0, pending.bestStreak || 0),
        streak_current: 0,
        updated_at: new Date().toISOString(),
      }

      if (stats) {
        await supabase.from('player_stats').update(row)
          .eq('user_id', userId).eq('game', pending.game)
      } else {
        await supabase.from('player_stats').insert(row)
      }
    }

    return pending
  } catch (e) {
    console.error('flushPendingScore:', e?.message)
    return null
  }
}