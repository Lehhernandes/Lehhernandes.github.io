const CLIENT_ID = '2ab4e425c5724a13addd8a6a4d2febc3';
const CLIENT_SECRET = '27bba488a34a413080dc53571f379710';

async function obterToken() {
  const resposta = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + btoa(CLIENT_ID + ':' + CLIENT_SECRET)
    },
    body: 'grant_type=client_credentials'
  });
  const dados = await resposta.json();
  return dados.access_token;
}

async function buscarMusica(token) {
  const resposta = await fetch(`https://api.spotify.com/v1/search?q=marilia%20mendonca&type=track&limit=10`, {
    headers: {
      'Authorization': 'Bearer ' + token
    }
  });
  const dados = await resposta.json();
  return dados.tracks.items.filter(m => m.preview_url);
}

function criarPergunta(musica, opcoes) {
  const audio = document.getElementById("audioPlayer");
  audio.src = musica.preview_url;

  const playButton = document.getElementById("playButton");
  playButton.onclick = () => {
    audio.play();
  };

  const div = document.getElementById("opcoes");
  div.innerHTML = '';

  opcoes.forEach(opcao => {
    const btn = document.createElement("button");
    btn.innerText = opcao;
    btn.onclick = () => {
      document.getElementById("resultado").innerText =
        opcao === musica.artists[0].name ? "✅ Acertou!" : "❌ Errou!";
    };
    div.appendChild(btn);
  });
}

async function iniciarJogo() {
  const token = await obterToken();
  const musicas = await buscarMusica(token);

  const musicaEscolhida = musicas[Math.floor(Math.random() * musicas.length)];
  const nomesErrados = musicas
    .filter(m => m.artists[0].name !== musicaEscolhida.artists[0].name)
    .map(m => m.artists[0].name)
    .slice(0, 3);

  const opcoes = [...nomesErrados, musicaEscolhida.artists[0].name]
    .sort(() => Math.random() - 0.5); // embaralhar

  criarPergunta(musicaEscolhida, opcoes);
}

iniciarJogo();
