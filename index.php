<?php
session_start();
if(!isset($_SESSION['whatsapp_connected'])){
    header("Location: login.php");
    exit;
}

$ANUNCIOS_FILE = __DIR__ . '/anuncios.json';
$GRUPOS_FILE = __DIR__ . '/grupos.json';

// Carregar anúncios
$anuncios = file_exists($ANUNCIOS_FILE) ? json_decode(file_get_contents($ANUNCIOS_FILE), true) : [];
// Carregar grupos
$grupos = file_exists($GRUPOS_FILE) ? json_decode(file_get_contents($GRUPOS_FILE), true) : [];

// Salvar novo anúncio
if($_SERVER['REQUEST_METHOD']=='POST' && isset($_POST['titulo'])){
    $novo = [
        'id'=>time(),
        'titulo'=>$_POST['titulo'],
        'mensagem'=>$_POST['mensagem'],
        'link_midia'=>$_POST['link_midia'],
        'ativo'=>$_POST['ativo']
    ];
    $anuncios[] = $novo;
    file_put_contents($ANUNCIOS_FILE, json_encode($anuncios, JSON_PRETTY_PRINT));
    header("Location: index.php");
    exit;
}
?>
<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Gerenciador WhatsApp</title>
<style>
body { margin:0; font-family:sans-serif; background:#0b0b0b; color:#fff;}
header { background:#111; padding:15px; text-align:center; color:#1e90ff; font-size:20px;}
.container { padding:10px;}
h2 { color:#1e90ff; margin-top:20px;}
input, textarea, select { width:100%; padding:8px; margin:5px 0; border-radius:5px; border:none;}
button { padding:10px; border:none; border-radius:5px; cursor:pointer; margin-top:5px;}
.btn-add { background:#1e90ff; color:#fff;}
.btn-add:hover { background:#ff0000;}
.btn-logout { background:#ff0000; color:#fff; float:right;}
.btn-logout:hover { background:#1e90ff;}
.anuncio { background:#111; padding:10px; margin:10px 0; border-radius:8px;}
.anuncio h3 { margin:0; color:#ff0000;}
</style>
</head>
<body>
<header>
Gerenciador WhatsApp
<form method="POST" action="logout.php" style="display:inline;">
<button class="btn-logout">Encerrar Sessão</button>
</form>
</header>
<div class="container">

<h2>Criar Anúncio</h2>
<form method="POST" action="index.php">
<input type="text" name="titulo" placeholder="Título do anúncio" required>
<textarea name="mensagem" placeholder="Mensagem do anúncio" required></textarea>
<input type="text" name="link_midia" placeholder="URL da imagem ou vídeo (opcional)">
<select name="ativo">
<option value="1">Ativo</option>
<option value="0">Inativo</option>
</select>
<button type="submit" class="btn-add">Salvar Anúncio</button>
</form>

<h2>Anúncios Criados</h2>
<?php
foreach($anuncios as $a){
    echo "<div class='anuncio'>";
    echo "<h3>{$a['titulo']}</h3>";
    echo "<p>{$a['mensagem']}</p>";
    if($a['link_midia']) echo "<p>Mídia: <a href='{$a['link_midia']}' target='_blank'>Abrir</a></p>";
    echo "<p>Status: ".($a['ativo']==1?'Ativo':'Inativo')."</p>";
    echo "</div>";
}
?>

<h2>Grupos Disponíveis</h2>
<form method="POST" action="index.php">
<?php
foreach($grupos as $g){
    echo "<label><input type='checkbox' name='grupos[]' value='{$g['id']}'> {$g['nome']}</label><br>";
}
?>
<p>O envio agora é automático ao receber mensagens, respeitando intervalo de 2 horas por grupo.</p>
</form>

</div>
</body>
</html>