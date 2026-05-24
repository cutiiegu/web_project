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

$method = $_SERVER['REQUEST_METHOD'];
$request_uri = $_SERVER['REQUEST_URI'];
$path = parse_url($request_uri, PHP_URL_PATH);
$segments = explode('/', trim($path, '/'));
$order_id = isset($segments[2]) && is_numeric($segments[2]) ? (int)$segments[2] : null;

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
        $stmt = $pdo->prepare("INSERT INTO orders (name, phone, email, dessert, date, servings, message) VALUES (?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([
            $input['name'],
            $input['phone'],
            $input['email'] ?? null,
            $input['dessert'] ?? null,
            $input['date'] ?? null,
            $input['servings'] ?? null,
            $input['message'] ?? null
        ]);
        
        $order_id = $pdo->lastInsertId();
        
        echo json_encode([
            'success' => true,
            'message' => 'Заказ успешно отправлен! Мы свяжемся с вами в течение 2 часов.',
            'order_id' => $order_id
        ]);
    } catch (PDOException $e) {
        error_log($e->getMessage());
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Ошибка сохранения заказа']);
    }
    exit();
}

// PUT /api/application/{id} - обновление заказа (для авторизованных)
if ($method === 'PUT' && $order_id) {
    // Простая HTTP-авторизация (можно заменить на сессию)
    if (empty($_SERVER['PHP_AUTH_USER']) || empty($_SERVER['PHP_AUTH_PW']) ||
        $_SERVER['PHP_AUTH_USER'] !== 'admin' || md5($_SERVER['PHP_AUTH_PW']) !== md5('admin123')) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Unauthorized']);
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
        
        if ($stmt->rowCount() === 0) {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Заказ не найден']);
            exit();
        }
        
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
    if (empty($_SERVER['PHP_AUTH_USER']) || empty($_SERVER['PHP_AUTH_PW']) ||
        $_SERVER['PHP_AUTH_USER'] !== 'admin' || md5($_SERVER['PHP_AUTH_PW']) !== md5('admin123')) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Unauthorized']);
        exit();
    }
    
    try {
        $stmt = $pdo->prepare("SELECT * FROM orders WHERE id = ?");
        $stmt->execute([$order_id]);
        $order = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$order) {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Заказ не найден']);
            exit();
        }
        
        echo json_encode(['success' => true, 'data' => $order]);
    } catch (PDOException $e) {
        error_log($e->getMessage());
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Ошибка получения заказа']);
    }
    exit();
}

// Если метод не разрешён
http_response_code(405);
echo json_encode(['success' => false, 'error' => 'Method not allowed']);
?>