<?php
session_start();
if(isset($_SESSION['whatsapp_connected'])){
    header("Location: index.php");
    exit;
}
?>
<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Login WhatsApp</title>
<style>
body { margin:0; font-family:sans-serif; background:#0b0b0b; color:#fff; display:flex; justify-content:center; align-items:center; height:100vh;}
.container { text-align:center; background:#111; padding:20px; border-radius:10px;}
h1 { color:#1e90ff; }
.qr { margin:20px auto; width:200px; height:200px; border:2px solid #ff0000; display:flex; justify-content:center; align-items:center; }
button { padding:10px 20px; background:#1e90ff; color:#fff; border:none; border-radius:5px; cursor:pointer; margin-top:10px;}
button:hover { background:#ff0000;}
</style>
</head>
<body>
<div class="container">
<h1>Conectar WhatsApp</h1>
<div class="qr" id="qrcode">QR Code será gerado no terminal do Termux</div>
<p>Abra o Termux e execute <b>node login.js</b> para escanear o QR Code</p>
</div>
</body>
</html>