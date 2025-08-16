<?php
$anunciosFile = 'anuncios.json';
$gruposFile = 'grupos.json';
if(!file_exists($anunciosFile)) file_put_contents($anunciosFile, json_encode([]));
$anuncios = json_decode(file_get_contents($anunciosFile), true);
$grupos = file_exists($gruposFile) ? json_decode(file_get_contents($gruposFile), true) : [];

$action = $_POST['action'] ?? null;

// Adicionar anúncio
if($action==='add'){
    $anuncios = json_decode(file_get_contents($anunciosFile), true);
    $anuncios[] = [
        "id"=>uniqid(),
        "text"=>$_POST['text'],
        "images"=>explode("\n",$_POST['images']),
        "schedule"=>$_POST['schedule'],
        "grupos"=>$_POST['grupos'] ?? [],
        "active"=>true
    ];
    file_put_contents($anunciosFile, json_encode($anuncios, JSON_PRETTY_PRINT));
    header("Location: index.php"); exit;
}

// Finalizar conexão
if($action==='logout'){
    if(file_exists('auth_info.json')) unlink('auth_info.json');
    if(file_exists('qr_code.txt')) unlink('qr_code.txt');
    header("Location: index.php"); exit;
}

$qrCode = file_exists('qr_code.txt') ? file_get_contents('qr_code.txt') : null;
?>
<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Painel WhatsApp Bot</title>
<style>
body{background:#0a0a0a;color:#fff;font-family:Arial;margin:0;padding:0}
.container{max-width:600px;margin:auto;padding:20px}
h1,h2{text-align:center;color:#ff0033}
input,textarea,button{width:100%;margin:5px 0;padding:10px;border:none;border-radius:5px}
input,textarea{background:#111;color:#fff}
button{background:#0044ff;color:#fff;cursor:pointer}
button:hover{background:#ff0033}
img{display:block;margin:auto;max-width:100%}
@media(max-width:600px){.container{padding:10px}}
.checkbox-group{background:#111;padding:10px;border-radius:5px;max-height:150px;overflow-y:auto;margin:5px 0;}
</style>
</head>
<body>
<div class="container">
<h1>📱 Painel WhatsApp Bot</h1>

<?php if($qrCode): ?>
<h2>Escaneie o QR Code</h2>
<img src="<?= $qrCode ?>" alt="QR Code">
<?php else: ?>
<h2>Bot conectado ✅</h2>
<?php endif; ?>

<h2>Adicionar Anúncio</h2>
<form method="POST">
<input type="hidden" name="action" value="add">
<textarea name="text" placeholder="Texto do anúncio" required></textarea>
<textarea name="images" placeholder="URLs das imagens (uma por linha)"></textarea>
<input type="text" name="schedule" placeholder="Ex: 0 9 * * *" required>
<h3>Selecionar grupos</h3>
<div class="checkbox-group">
<?php foreach($grupos as $g): ?>
<label><input type="checkbox" name="grupos[]" value="<?= $g['id'] ?>"> <?= $g['subject'] ?></label><br>
<?php endforeach; ?>
</div>
<button type="submit">Adicionar</button>
</form>

<h2>Anúncios</h2>
<ul>
<?php foreach($anuncios as $a): ?>
<li><?= $a['text'] ?> - <?= $a['schedule'] ?> - Grupos: <?= implode(', ',$a['grupos']) ?></li>
<?php endforeach; ?>
</ul>

<form method="POST">
<input type="hidden" name="action" value="logout">
<button type="submit">Finalizar Conexão</button>
</form>
</div>
</body>
</html>