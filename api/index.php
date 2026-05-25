<?php
// 1. Сначала отправляем заголовки управления доступом (CORS)
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Если это предварительный запрос браузера, сразу выходим
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// 2. СТРОГО ЗДЕСЬ запускаем сессию (до подключения других файлов и вывода данных)
session_start();

// 3. Подключаем базу данных
require_once '../config.php';

// Вспомогательные функции генерации данных
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
    elseif (!preg_match('/^(\\+7|8)\\d{10}$/', $data['phone'])) $errors['phone'] = 'Неверный формат телефона';
    if (!empty($data['email']) && !filter_var($data['email'], FILTER_VALIDATE_EMAIL)) $errors['email'] = 'Неверный email';
    if (!empty($data['servings']) && ($data['servings'] < 1 || $data['servings'] > 50)) $errors['servings'] = 'Количество персон должно быть от 1 до 50';
    return $errors;
}

// Определяем метод запроса и ID (если передан)
$method = $_SERVER['REQUEST_METHOD'];
$request_uri = $_SERVER['REQUEST_URI'];
$script_name = $_SERVER['SCRIPT_NAME'];

$base_path = str_replace('index.php', '', $script_name);
$relative_path = str_replace($base_path, '', $request_uri);
$relative_path = explode('?', $relative_path)[0];
$relative_path = trim($relative_path, '/');

$path_parts = explode('/', $relative_path);
$resource = $path_parts[0] ?? '';
$order_id = (isset($path_parts[1]) && is_numeric($path_parts[1])) ? (int)$path_parts[1] : null;

if ($resource !== 'application') {
    http_response_code(404);
    echo json_encode(['success' => false, 'error' => 'Not Found']);
    exit();
}

// ПОЛУЧЕНИЕ ЗАКАЗОВ ТЕКУЩЕГО ПОЛЬЗОВАТЕЛЯ
if ($method === 'GET' && !$order_id) {
    $user_id = $_SESSION['user_id'] ?? null;
    if (!$user_id) {
        echo json_encode(['success' => true, 'orders' => []]);
        exit();
    }
    $stmt = $pdo->prepare("SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC");
    $stmt->execute([$user_id]);
    $orders = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode(['success' => true, 'orders' => $orders]);
    exit();
}

// СОЗДАНИЕ НОВОГО ЗАКАЗА
if ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true) ?: $_POST;
    $errors = validate_order_data($input);
    if (!empty($errors)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'errors' => $errors]);
        exit();
    }
    
    $user_id = $_SESSION['user_id'] ?? null;
    $generated_credentials = null;
    
    // Если пользователь не авторизован (сессия пустая) — создаем ему новый аккаунт
    if (!$user_id) {
        $login = generate_login();
        $plain_password = generate_password();
        $password_hash = password_hash($plain_password, PASSWORD_DEFAULT);
        
        $stmt = $pdo->prepare("INSERT INTO users (login, password_hash) VALUES (?, ?)");
        $stmt->execute([$login, $password_hash]);
        $user_id = $pdo->lastInsertId();
        
        // Сразу авторизуем его в текущей сессии
        $_SESSION['user_id'] = $user_id;
        $_SESSION['login'] = $login;
        
        $generated_credentials = ['login' => $login, 'password' => $plain_password];
    }
    
    // Сохраняем сам заказ в базу данных
    $stmt = $pdo->prepare("INSERT INTO orders (user_id, name, phone, email, dessert, date, servings, message) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
    $stmt->execute([
        $user_id,
        $input['name'],
        $input['phone'],
        $input['email'] ?? null,
        $input['dessert'] ?? null,
        $input['date'] ?? null,
        $input['servings'] ?? null,
        $input['message'] ?? null
    ]);
    
    $response_data = ['success' => true, 'message' => 'Заказ успешно создан!'];
    if ($generated_credentials) {
        $response_data['credentials'] = $generated_credentials;
    }
    
    echo json_encode($response_data);
    exit();
}

// ОБНОВЛЕНИЕ ЗАКАЗА
if ($method === 'PUT' && $order_id) {
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

// ПОЛУЧЕНИЕ КОНКРЕТНОГО ЗАКАЗА ПО ID
if ($method === 'GET' && $order_id) {
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
        echo json_encode(['success' => false, 'error' => 'Order Not Found']);
        exit();
    }
    echo json_encode(['success' => true, 'order' => $order]);
    exit();
}
?>
