<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config.php';

function generate_login() {
    return 'user_' . substr(md5(uniqid(mt_rand(), true)), 0, 8);
}

function generate_password() {
    return substr(md5(uniqid(mt_rand(), true)), 0, 6);
}

function validate_order_data($data) {
    $errors = [];
    if (empty($data['name'])) $errors['name'] = 'Имя обязательно';
    if (empty($data['phone'])) $errors['phone'] = 'Телефон обязателен';
    elseif (!preg_match('/^(\+7|8)\d{10}$/', $data['phone'])) $errors['phone'] = 'Неверный формат телефона';
    if (!empty($data['email']) && !filter_var($data['email'], FILTER_VALIDATE_EMAIL)) $errors['email'] = 'Неверный email';
    if (!empty($data['servings']) && ($data['servings'] < 1 || $data['servings'] > 50)) $errors['servings'] = 'Персоны от 1 до 50';
    return $errors;
}

$method = $_SERVER['REQUEST_METHOD'];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$segments = explode('/', trim($path, '/'));
$order_id = isset($segments[3]) && is_numeric($segments[3]) ? (int)$segments[3] : null;

if ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true) ?: $_POST;
    $errors = validate_order_data($input);
    if (!empty($errors)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'errors' => $errors]);
        exit();
    }
    
    session_start();
    $user_id = $_SESSION['user_id'] ?? null;
    $generated_credentials = null;
    
    if (!$user_id) {
        $login = generate_login();
        $plain_password = generate_password();
        $stmt = $pdo->prepare("INSERT INTO users (login, password_hash) VALUES (?, ?)");
        $stmt->execute([$login, password_hash($plain_password, PASSWORD_DEFAULT)]);
        $user_id = $pdo->lastInsertId();
        $generated_credentials = ['login' => $login, 'password' => $plain_password];
    }
    
    $stmt = $pdo->prepare("INSERT INTO orders (name, phone, email, dessert, date, servings, message, user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
    $stmt->execute([$input['name'], $input['phone'], $input['email'] ?? null, $input['dessert'] ?? null, $input['date'] ?? null, $input['servings'] ?? null, $input['message'] ?? null, $user_id]);
    
    $response = ['success' => true, 'message' => 'Заказ отправлен!', 'order_id' => $pdo->lastInsertId()];
    if ($generated_credentials) $response['credentials'] = $generated_credentials;
    echo json_encode($response);
    exit();
}

if ($method === 'PUT' && $order_id) {
    session_start();
    if (!isset($_SESSION['user_id'])) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Unauthorized']);
        exit();
    }
    
    $input = json_decode(file_get_contents('php://input'), true) ?: $_POST;
    $stmt = $pdo->prepare("UPDATE orders SET name = ?, phone = ?, email = ?, dessert = ?, date = ?, servings = ?, message = ? WHERE id = ? AND user_id = ?");
    $stmt->execute([$input['name'], $input['phone'], $input['email'] ?? null, $input['dessert'] ?? null, $input['date'] ?? null, $input['servings'] ?? null, $input['message'] ?? null, $order_id, $_SESSION['user_id']]);
    echo json_encode(['success' => true, 'message' => 'Заказ обновлён']);
    exit();
}

if ($method === 'GET' && $order_id) {
    session_start();
    if (!isset($_SESSION['user_id'])) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Unauthorized']);
        exit();
    }
    $stmt = $pdo->prepare("SELECT * FROM orders WHERE id = ? AND user_id = ?");
    $stmt->execute([$order_id, $_SESSION['user_id']]);
    $order = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$order) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Not found']);
        exit();
    }
    echo json_encode(['success' => true, 'data' => $order]);
    exit();
}

http_response_code(405);
echo json_encode(['success' => false, 'error' => 'Method not allowed']);
?>
