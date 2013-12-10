<?php

/*
 *  Copyright (c) 2013 PolyFloyd
 */

header("Content-Type: text/plain");
header("Access-Control-Allow-Origin: *");
$id = isset($_GET['id']) ? $_GET['id'] : "";
if (preg_match("/[a-zA-Z0-9_-]{11}/", $id)) {
	echo file_get_contents("http://youtube.com/watch?v=" . $_GET['id']);
} else {
	echo "Oh Long Johnson";
}

?>
