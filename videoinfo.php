<?php

header("Content-Type: text/plain");
header("Access-Control-Allow-Origin: *");
$content = file_get_contents("http://youtube.com/get_video_info?video_id=" . $_GET['id']);
echo $content;

?>