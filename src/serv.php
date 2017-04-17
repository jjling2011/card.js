<?php

$op = substr(filter_input(INPUT_POST, "op", FILTER_SANITIZE_STRING), 0, 50);
$data = filter_input(INPUT_POST, "data", FILTER_UNSAFE_RAW);

header('Content-Type: application/json; charset=utf-8');

$f = [];

$f['echo_str'] = function($msg) {
    ok($msg);
};

$f['checklogin']=function($raw_names){
    $names=json_decode($raw_names,true);
    $s=[];
    foreach ($names as $name) {
        $s[$name]=  check_login($name);
    }
    ok($s);
};

function check_login($name) {
    if(strcmp($name,'Amy')===0){
        return true;
    }
    return false;
}

function ok($d) {
    die(json_encode(array(
        'status' => true,
        'msg' => 'ok',
        'data' => $d)));
}

function fail($msg) {
    die(json_encode(array(
        'status' => false,
        'msg' => $msg,
        'data' => null)));
}

if (array_key_exists($op, $f)){
    $f[$op]($data);
}else{
    fail('Operation not supported!');
}

fail('Unknow error!');

    