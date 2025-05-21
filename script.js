const token = 'BQB6qQkgvXETX0XLFGR1CxZLXC-NzNyjp711ekM9bVSNsE-8JDMFDlnKcFkdPTZLhth5Bi0SkMgcCtx1x-WWTAWoksZJ-dbtDeWuP9NAkb6G-zIThaHPRb6L5Y6-5PB6yBGh37sLfhXUC512x1bKoyK3QHcnXNinOS8VhPmwDEGISRDLwOOiuyLnU6OfYA3PZwdo8vY78BtUGpuo38ibmaf3VNy8gKu4ZAnIO4uPxgjWiro8lA'; // precisa ser gerado com OAuth (com permissão streaming)
let player;
let deviceId = null;
let tracks = [];
let nomeMusicaAtual = '';
let pontos = 0;
let currentTrackIndex = 0;
let erros = 0;
let resultados = []; // vai armazenar { nome: 'Nome da música', resultado: 'acertou' ou 'errou' }
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

};

function atualizarPontuacao() {
  const pontuacao = document.getElementById('pontuacao');
  pontuacao.textContent = `Acertos: ${pontos}/${tracks.length} ponto${pontos !== 1 ? 's' : ''} | Erros: ${erros}`;
}
function embaralharArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}


async function carregarPlaylist() {
  const response = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  const data = await response.json();
  if (!data.items) {
    console.error('Não conseguiu carregar as faixas da playlist');
    return;
  }

  tracks = data.items
  .filter(item => item.track && item.track.uri)
  .map(item => ({
    uri: item.track.uri,
    name: item.track.name
  }));

  tracks = embaralharArray(tracks);
  console.log('🎵 Ordem embaralhada:', tracks.map(t => t.name));
  tocarMusicaAtual();
  atualizarPontuacao();
}
function iniciarCronometro(duracaoSegundos, elemento) {
  let tempoRestante = duracaoSegundos;

  function atualizar() {
    const minutos = Math.floor(tempoRestante / 60);
    const segundos = tempoRestante % 60;
    elemento.textContent = `${String(minutos).padStart(2, '0')}:${String(segundos).padStart(2, '0')}`;

    if (tempoRestante > 0) {
      tempoRestante--;
      setTimeout(atualizar, 1000);
    } else {
      elemento.textContent = '00:00';
      alert('⏰ Tempo esgotado!');
    }
  }

  atualizar();
}

window.addEventListener('load', () => {
  const elementoCronometro = document.getElementById('cronometro');
  iniciarCronometro(60 * 60, elementoCronometro); // 1 hora
      document.getElementById('reiniciar').onclick = () => {
  currentTrackIndex = 0;
  pontos = 0;
  erros = 0;
  tracks = embaralharArray(tracks); // reembaralha a ordem
  atualizarPontuacao();
  tocarMusicaAtual();
  document.getElementById('resposta').value = '';
  document.getElementById('resposta').focus();
  document.getElementById('resultado').textContent = '';
  document.getElementById('listaResultados').innerHTML = '';
  document.getElementById('listaResultados').style.display = 'none';
  resultados = [];


};


  document.getElementById('play').onclick = () => player.resume();
  document.getElementById('pause').onclick = () => player.pause();

  document.getElementById('next').onclick = () => {
    if (currentTrackIndex < tracks.length - 1) {
    currentTrackIndex++;
    tocarMusicaAtual();
    } else {
      alert(`🏁 Fim da playlist!\nVocê acertou ${pontos} de ${tracks.length} músicas!\nErros: ${erros}`);
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
      erros++;
      resultado.textContent = `❌ Errou! A música correta era: "${tracks[currentTrackIndex].name}"`;
      atualizarPontuacao();
    }
    resultados.push({
      nome: tracks[currentTrackIndex].name,
      resultado: resposta === nomeCorreto ? 'acertou' : 'errou'
    });


  document.getElementById('resposta').value = '';
  document.getElementById('resposta').focus();
  };
});

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
      uris: [tracks[currentTrackIndex].uri], // tocando apenas essa música
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
document.getElementById('mostrarResultados').onclick = () => {
  const lista = document.getElementById('listaResultados');
  if (lista.style.display === 'none') {
    lista.innerHTML = resultados.map(r => {
      const emoji = r.resultado.toLowerCase() === 'acertou' ? '✅' : '❌';
      return `<p>${emoji} ${r.nome} — ${r.resultado[0].toUpperCase() + r.resultado.slice(1)}</p>`;
    }).join('');
    lista.style.display = 'block';
  } else {
    lista.style.display = 'none';
  }
};

