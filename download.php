<?php

if(empty($_POST['filename']) || empty($_POST['content'])){
	exit;
}

$filename = preg_replace('/[^a-z0-9\-\_\.]/i','',$_POST['filename']);

header("Cache-Control: ");
header("Content-type: text/plain;charset=utf-8");
header("encoding: utf-8");
header('Content-Disposition: attachment; filename="'.$filename.'"');

echo $_POST['content'];

?>