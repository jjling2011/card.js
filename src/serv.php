<?php


$op = substr(filter_input(INPUT_POST, "op", FILTER_SANITIZE_STRING), 0, 50);
$data = filter_input(INPUT_POST, "data", FILTER_UNSAFE_RAW);

header('Content-Type: application/json; charset=utf-8');

switch ($op) {
    case 'echo_str':
    case 'echo_json':
        ok($op, $data);
        break;
    case 'function_for_logined_users':
        login_ok($op, $data);
    default:
        fail('Unsupport operation: ' . $op);
}

fail('Oops');

function function_for_logined_users(){
    return 'Hello!';
}

function echo_str($param){
    return $param;
}


function echo_json($raw_param) {
    $jd = json_decode($raw_param,true);
    return $jd;
}

function check_login(){
    return false;
}

function login_ok($func) {
    $param = func_get_args();
    $num = count($param);
    if (check_login) {
        fail('Error: please login first!');
    }
    if ($num < 2) {
        $data = $func();
    } else {
        $data = $func($param[1]);
    }
    die(json_encode(array(
        'status' => true,
        'msg' => 'ok',
        'data' => $data)));
}

function ok($func) {
    $param = func_get_args();
    $num = count($param);
    if ($num < 2) {
        $data = $func();
    } else {
        $data = $func($param[1]);
    }
    die(json_encode(array(
        'status' => true,
        'msg' => 'ok',
        'data' => $data)));
}

function fail($msg) {
    die(json_encode(array(
        'status' => false,
        'msg' => $msg,
        'data' => false)));
}
