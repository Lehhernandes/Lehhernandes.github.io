const token = 'BQBqgzzxdMnDHXvARScdQYKVPA-WFHNpX9cKxFITx8pVlFPo2GptNKZbeWxY_lc-_A8u7pWVuCPh2KRiAhfloVaGKXlmEIuhj4J6MNcfAwK-W0g26WmJG2IE5izxUWRuG2i9AS2iGIiOXuFpOdmWXysgctE8E3YJ58wYIXNv3uVSC4v7_NlUfb3BM0zKGYlWCwNgaPeIP2gIkjUn4CGfVxBgVSZzh16lS0IeHvCfGrsWeq_XPA'; // precisa ser gerado com OAuth (com permissão streaming)
let player;
let deviceId = null;
let currentTrackIndex = 0;
let tracks = [];
const playlistId = '37i9dQZF1DXc5EXfkDXlmk';

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

  player.addListener('initialization_error', ({ message }) => { console.error(message); });
  player.addListener('authentication_error', ({ message }) => { console.error(message); });
  player.addListener('account_error', ({ message }) => { console.error(message); });
  player.addListener('not_ready', ({ device_id }) => { console.warn('Dispositivo desconectado:', device_id); });

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
};

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
}

function tocarMusicaAtual() {
  if (!deviceId) {
    console.warn('Device ID não disponível ainda.');
    return;
  }

  if (tracks.length === 0 || currentTrackIndex >= tracks.length) {
    console.warn('🎶 Fim da playlist ou nenhuma faixa.');
    return;
  }

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
    mostrarOpcoes();
    limparResultado();
  }).catch(e => {
    console.error('Erro ao tocar música:', e);
  });
}

function gerarOpcoesMusicas() {
  if (tracks.length === 0 || currentTrackIndex >= tracks.length) return [];

  const nomeCorreto = tracks[currentTrackIndex].name;

  const todosNomes = new Set(tracks.map(t => t.name));
  todosNomes.delete(nomeCorreto);

  const nomesErrados = Array.from(todosNomes);
  const opcoesErradas = [];

  while (opcoesErradas.length < 3 && nomesErrados.length > 0) {
    const idx = Math.floor(Math.random() * nomesErrados.length);
    opcoesErradas.push(nomesErrados.splice(idx, 1)[0]);
  }

  const opcoes = [...opcoesErradas, nomeCorreto];
  return opcoes.sort(() => Math.random() - 0.5);
}

function mostrarOpcoes() {
  const divOpcoes = document.getElementById('opcoes');
  divOpcoes.innerHTML = '';

  const opcoes = gerarOpcoesMusicas();
  if (opcoes.length === 0) {
    divOpcoes.textContent = 'Nenhuma opção disponível.';
    return;
  }

  opcoes.forEach(opcao => {
    const btn = document.createElement('button');
    btn.textContent = opcao;
    btn.onclick = () => verificarResposta(opcao);
    divOpcoes.appendChild(btn);
  });
}

function verificarResposta(escolha) {
  const nomeCorreto = tracks[currentTrackIndex].name;
  const resultado = document.getElementById('resultado');

  if (escolha === nomeCorreto) {
    resultado.textContent = '✅ Acertou!';
  } else {
    resultado.textContent = `❌ Errou! A música correta é: "${nomeCorreto}"`;
  }
}

function limparResultado() {
  document.getElementById('resultado').textContent = '';
}