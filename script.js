const token = 'BQCalKwLvf5W8efFS7medO1pPm-bYPIpkLaLfxpM7MMQ6HeQhAfCFUDCsYs8wxBzLplOBNU7uIt3m_x4StyhhecgjyIdep7IYCn5hJmhJkFVSxfzJ7H5ajI61kYF8zASzSEeYqZv89iRH5U2bYfhhXwrMNQQYJbbJxhMGXRPLWBL_JWW9JAZ05Hfgpg3SEqLd3S-WAzmL0ITADVQfIpzbk9FgTwlfEi0pMWrn5-95qvTqzefVQ'; // precisa ser gerado com OAuth (com permissão streaming)
let player;
let deviceId = null;
let currentTrackIndex = 0;
let tracks = [];
let nomeMusicaAtual = '';
let pontos = 0;
const playlistId = '65fQX3Uz8gPC9mQYdwXNzg';

window.onSpotifyWebPlaybackSDKReady = () => {
  player = new Spotify.Player({
    name: 'Toca Aí Web Player',
    getOAuthToken: cb => { cb(token); },
    volume: 0.5
  });

  player.addListener('ready', ({ device_id }) => {
    console.log('✅ Player pronto:', device_id);
    deviceId = device_id;
    carregarPlaylist();
  });

  player.addListener('initialization_error', ({ message }) => console.error(message));
  player.addListener('authentication_error', ({ message }) => console.error(message));
  player.addListener('account_error', ({ message }) => console.error(message));
  player.addListener('not_ready', ({ device_id }) => console.warn('Dispositivo desconectado:', device_id));

  player.connect();

  document.getElementById('play').onclick = () => player.resume();
  document.getElementById('pause').onclick = () => player.pause();

  document.getElementById('next').onclick = () => {
    if (currentTrackIndex < tracks.length - 1) {
      currentTrackIndex++;
      tocarMusicaAtual();
    } else {
      alert('🚫 Última faixa da playlist.');
    }
  };

  document.getElementById('previous').onclick = () => {
    if (currentTrackIndex > 0) {
      currentTrackIndex--;
      tocarMusicaAtual();
    }
  };


  document.getElementById('verificar').onclick = () => {
    const resposta = normalizarTexto(document.getElementById('resposta').value);
    const nomeCorreto = normalizarTexto(tracks[currentTrackIndex].name);
    const resultado = document.getElementById('resultado');

    if (resposta === nomeCorreto){
      pontos++;
      resultado.textContent = '✅ Acertou!';
      atualizarPontuacao();
    } else {
      resultado.textContent = `❌ Errou! A música correta é: "${nomeCorreto}"`;
    }

  document.getElementById('resposta').value = '';
  };
};
function atualizarPontuacao() {
  const pontuacao = document.getElementById('pontuacao');
  pontuacao.textContent = `Acertos: ${pontos}/${tracks.length} ponto${pontos !== 1 ? 's' : ''}`;
}


async function carregarPlaylist() {
  const response = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=50`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  const data = await response.json();
  if (!data.items) {
    console.error('Não conseguiu carregar as faixas da playlist');
    return;
  }

  tracks = data.items.map(item => ({
    uri: item.track.uri,
    name: item.track.name
  }));

  tocarMusicaAtual();
  atualizarPontuacao();

}

function tocarMusicaAtual() {
  if (!deviceId || tracks.length === 0 || currentTrackIndex >= tracks.length) return;

  nomeMusicaAtual = tracks[currentTrackIndex].name.toLowerCase();

  fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      context_uri: `spotify:playlist:${playlistId}`,
      offset: { position: currentTrackIndex },
      position_ms: 0
    })
  }).then(() => {
    document.getElementById('resultado').textContent = '';
  }).catch(e => {
    console.error('Erro ao tocar música:', e);
  });
}
function normalizarTexto(texto) {
  return texto
    .toLowerCase()
    .replace(/\(.*?\)/g, '') // remove qualquer coisa entre parênteses
    .replace(/ao vivo|live|versão acústica|acústico|remasterizado/gi, '') // remove termos comuns
    .replace(/[^\w\s]/gi, '') // remove pontuações
    .trim();
}
