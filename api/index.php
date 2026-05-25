<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-CSRF-Token');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config.php';

// Функция генерации логина и пароля
function generate_login() {
    return 'user_' . substr(md5(uniqid(mt_rand(), true)), 0, 8);
}

function generate_password() {
    return substr(md5(uniqid(mt_rand(), true)), 0, 6);
}

// Валидация данных формы
function validate_order_data($data) {
    $errors = [];
    
    if (empty($data['name'])) {
        $errors['name'] = 'Имя обязательно для заполнения';
    } elseif (strlen($data['name']) > 100) {
        $errors['name'] = 'Имя не может быть длиннее 100 символов';
    }
    
    if (empty($data['phone'])) {
        $errors['phone'] = 'Телефон обязателен для заполнения';
    } elseif (!preg_match('/^(\+7|8)\d{10}$/', $data['phone'])) {
        $errors['phone'] = 'Телефон должен быть в формате +7XXXXXXXXXX или 8XXXXXXXXXX';
    }
    
    if (!empty($data['email']) && !filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
        $errors['email'] = 'Некорректный формат email';
    }
    
    if (!empty($data['date']) && !preg_match('/^\d{4}-\d{2}-\d{2}$/', $data['date'])) {
        $errors['date'] = 'Неверный формат даты';
    }
    
    if (!empty($data['servings']) && ($data['servings'] < 1 || $data['servings'] > 50)) {
        $errors['servings'] = 'Количество персон должно быть от 1 до 50';
    }
    
    return $errors;
}

$method = $_SERVER['REQUEST_METHOD'];
$request_uri = $_SERVER['REQUEST_URI'];
$path = parse_url($request_uri, PHP_URL_PATH);
$segments = explode('/', trim($path, '/'));
$order_id = isset($segments[3]) && is_numeric($segments[3]) ? (int)$segments[3] : null;

// POST /api/application - создание нового заказа
if ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input) {
        $input = $_POST;
    }
    
    $errors = validate_order_data($input);
    
    if (!empty($errors)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'errors' => $errors]);
        exit();
    }
    
    try {
        // Проверяем, авторизован ли пользователь
        session_start();
        $user_id = $_SESSION['user_id'] ?? null;
        
        if (!$user_id) {
            // Создаём нового пользователя
            $login = generate_login();
            $plain_password = generate_password();
            $password_hash = password_hash($plain_password, PASSWORD_DEFAULT);
            
            $stmt = $pdo->prepare("INSERT INTO users (login, password_hash) VALUES (?, ?)");
            $stmt->execute([$login, $password_hash]);
            $user_id = $pdo->lastInsertId();
            
            $generated_credentials = [
                'login' => $login,
                'password' => $plain_password
            ];
        } else {
            $generated_credentials = null;
        }
        
        // Сохраняем заказ
        $stmt = $pdo->prepare("INSERT INTO orders (name, phone, email, dessert, date, servings, message, user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([
            $input['name'],
            $input['phone'],
            $input['email'] ?? null,
            $input['dessert'] ?? null,
            $input['date'] ?? null,
            $input['servings'] ?? null,
            $input['message'] ?? null,
            $user_id
        ]);
        
        $order_id = $pdo->lastInsertId();
        
        $response = [
            'success' => true,
            'message' => 'Заказ успешно отправлен! Мы свяжемся с вами в течение 2 часов.',
            'order_id' => $order_id
        ];
        
        if ($generated_credentials) {
            $response['credentials'] = $generated_credentials;
            $response['message'] .= ' Сохраните логин и пароль для редактирования заказа.';
        }
        
        echo json_encode($response);
    } catch (PDOException $e) {
        error_log($e->getMessage());
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Ошибка сохранения заказа']);
    }
    exit();
}

// PUT /api/application/{id} - обновление заказа
if ($method === 'PUT' && $order_id) {
    session_start();
    $user_id = $_SESSION['user_id'] ?? null;
    
    if (!$user_id) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Unauthorized. Please login first.']);
        exit();
    }
    
    // Проверяем, принадлежит ли заказ этому пользователю
    $stmt = $pdo->prepare("SELECT user_id FROM orders WHERE id = ?");
    $stmt->execute([$order_id]);
    $order = $stmt->fetch();
    
    if (!$order || $order['user_id'] != $user_id) {
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'Forbidden. You can only edit your own orders.']);
        exit();
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    if (!$input) {
        $input = $_POST;
    }
    
    $errors = validate_order_data($input);
    
    if (!empty($errors)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'errors' => $errors]);
        exit();
    }
    
    try {
        $stmt = $pdo->prepare("UPDATE orders SET name = ?, phone = ?, email = ?, dessert = ?, date = ?, servings = ?, message = ? WHERE id = ?");
        $stmt->execute([
            $input['name'],
            $input['phone'],
            $input['email'] ?? null,
            $input['dessert'] ?? null,
            $input['date'] ?? null,
            $input['servings'] ?? null,
            $input['message'] ?? null,
            $order_id
        ]);
        
        echo json_encode([
            'success' => true,
            'message' => 'Заказ успешно обновлён'
        ]);
    } catch (PDOException $e) {
        error_log($e->getMessage());
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Ошибка обновления заказа']);
    }
    exit();
}

// GET /api/application/{id} - получение заказа
if ($method === 'GET' && $order_id) {
    session_start();
    $user_id = $_SESSION['user_id'] ?? null;
    
    if (!$user_id) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Unauthorized']);
        exit();
    }
    
    $stmt = $pdo->prepare("SELECT * FROM orders WHERE id = ?");
    $stmt->execute([$order_id]);
    $order = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$order) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Заказ не найден']);
        exit();
    }
    
    if ($order['user_id'] != $user_id) {
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'Forbidden']);
        exit();
    }
    
    echo json_encode(['success' => true, 'data' => $order]);
    exit();
}

http_response_code(405);
echo json_encode(['success' => false, 'error' => 'Method not allowed']);
?>
