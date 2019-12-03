<?php

// GET VALUES SENT FROM GAME
$hsArray = $_POST['hsarray'];
$gp = $_POST['gp'];

if ($gp == 'p') {
    // UPDATE HIGH SCORE FILE ON SERVER
    $hsFile = fopen("hs.raz", "w") or die("error");
    $theArray = $hsArray;
    fwrite($hsFile, $theArray);
    fclose($hsFile);
    echo("success");
} else {
    // GET HIGH SCORE FILE FROM SERVER
    $hsFile = fopen("hs.raz", "r") or die("error");
    $theArray = fread($hsFile,filesize("hs.raz"));
    fclose($hsFile);
    echo($theArray);
}
?>