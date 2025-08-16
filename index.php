<?php
$GRUPOS_FILE = 'grupos.json';
$ANUNCIOS_FILE = 'anuncios.json';

$grupos = json_decode(file_get_contents($GRUPOS_FILE), true);
$anuncios = json_decode(file_get_contents($ANUNCIOS_FILE), true);
?>

<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>Painel Botteste</title>
<style>
body { font-family: Arial; background: #121212; color: #fff; }
h2 { color: #1E90FF; }
input, textarea, select { width: 100%; padding: 5px; margin: 3px 0; }
button { padding: 5px 10px; margin-top: 5px; }
.container { max-width: 800px; margin: auto; }
.card { background: #222; padding: 10px; margin-bottom: 10px; border-radius: 5px; }
</style>
</head>
<body>
<div class="container">
<h1>Painel Botteste</h1>

<h2>Grupos</h2>
<?php foreach($grupos as $i => $g): ?>
<div class="card">
<form method="POST" action="save.php">
    <input type="hidden" name="tipo" value="grupo">
    <input type="hidden" name="index" value="<?= $i ?>">
    Nome: <input type="text" name="nome" value="<?= $g['nome'] ?>">
    ID: <input type="text" name="id" value="<?= $g['id'] ?>">
    <button type="submit" name="acao" value="editar">Salvar</button>
    <button type="submit" name="acao" value="excluir">Excluir</button>
</form>
</div>
<?php endforeach; ?>

<div class="card">
<h3>Adicionar Grupo</h3>
<form method="POST" action="save.php">
<input type="hidden" name="tipo" value="grupo">
Nome: <input type="text" name="nome">
ID: <input type="text" name="id">
<button type="submit" name="acao" value="adicionar">Adicionar</button>
</form>
</div>

<h2>Anúncios</h2>
<?php foreach($anuncios as $i => $a): ?>
<div class="card">
<form method="POST" action="save.php">
    <input type="hidden" name="tipo" value="anuncio">
    <input type="hidden" name="index" value="<?= $i ?>">
    Título: <input type="text" name="titulo" value="<?= $a['titulo'] ?>">
    Mensagem: <textarea name="mensagem"><?= $a['mensagem'] ?></textarea>
    Link mídia: <input type="text" name="link_midia" value="<?= $a['link_midia'] ?>">
    Ativo: <select name="ativo">
        <option value="1" <?= $a['ativo']==1?'selected':'' ?>>Sim</option>
        <option value="0" <?= $a['ativo']==0?'selected':'' ?>>Não</option>
    </select>
    <button type="submit" name="acao" value="editar">Salvar</button>
    <button type="submit" name="acao" value="excluir">Excluir</button>
</form>
</div>
<?php endforeach; ?>

<div class="card">
<h3>Adicionar Anúncio</h3>
<form method="POST" action="save.php">
<input type="hidden" name="tipo" value="anuncio">
Título: <input type="text" name="titulo">
Mensagem: <textarea name="mensagem"></textarea>
Link mídia: <input type="text" name="link_midia">
Ativo: <select name="ativo">
    <option value="1">Sim</option>
    <option value="0">Não</option>
</select>
<button type="submit" name="acao" value="adicionar">Adicionar</button>
</form>
</div>

</div>
</body>
</html>