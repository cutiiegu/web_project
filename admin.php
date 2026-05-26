<?php
require_once 'config.php';

$valid_admin_login = 'admin';
$valid_admin_pass = 'admin123';

if (empty($_SERVER['PHP_AUTH_USER']) || empty($_SERVER['PHP_AUTH_PW']) ||
    $_SERVER['PHP_AUTH_USER'] != $valid_admin_login || md5($_SERVER['PHP_AUTH_PW']) != md5($valid_admin_pass)) {
    header('HTTP/1.1 401 Unauthorized');
    header('WWW-Authenticate: Basic realm="Admin Panel - Sweet Moments"');
    echo '<h1>401 Требуется авторизация</h1>';
    echo '<p>Логин: admin, пароль: admin123</p>';
    exit();
}

$message = '';
$edit_order = null;

// Обработка удаления через POST
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['delete_id'])) {
    $delete_id = (int)$_POST['delete_id'];
    $stmt = $pdo->prepare("DELETE FROM orders WHERE id = ?");
    $stmt->execute([$delete_id]);
    $message = '<div class="success">Заказ удалён</div>';
}

// Получение данных для редактирования
if (isset($_GET['edit']) && is_numeric($_GET['edit'])) {
    $id = (int)$_GET['edit'];
    $stmt = $pdo->prepare("SELECT * FROM orders WHERE id = ?");
    $stmt->execute([$id]);
    $edit_order = $stmt->fetch(PDO::FETCH_ASSOC);
}

// Обработка обновления заказа
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['update_id'])) {
    $update_id = (int)$_POST['update_id'];
    $stmt = $pdo->prepare("UPDATE orders SET name = ?, phone = ?, email = ?, dessert = ?, date = ?, servings = ?, message = ? WHERE id = ?");
    $stmt->execute([
        $_POST['name'], $_POST['phone'], $_POST['email'], $_POST['dessert'],
        $_POST['date'], (int)$_POST['servings'], $_POST['message'], $update_id
    ]);
    $message = '<div class="success">Заказ обновлён</div>';
    $edit_order = null;
}

$orders = $pdo->query("SELECT * FROM orders ORDER BY created_at DESC")->fetchAll();
$dessert_stats = $pdo->query("SELECT dessert, COUNT(*) as count FROM orders GROUP BY dessert ORDER BY count DESC")->fetchAll();
$total_orders = count($orders);
?>
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <title>Админка - Sweet Moments</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Open Sans', sans-serif; background: #f5e6d3; padding: 20px; }
        .container { max-width: 1400px; margin: 0 auto; background: #fdf8f0; border-radius: 20px; padding: 30px; border: 1px solid #d4a373; }
        h1, h2 { color: #8B4513; border-bottom: 3px solid #DAA520; padding-bottom: 10px; margin-bottom: 20px; }
        .stat-card { background: #DAA520; color: white; padding: 20px; border-radius: 15px; text-align: center; display: inline-block; margin-right: 20px; min-width: 200px; }
        .stat-card .number { font-size: 48px; font-weight: bold; }
        .stats-table { background: #f5e6d3; border-radius: 15px; padding: 20px; margin-bottom: 30px; }
        .stats-table table, .data-table { width: 100%; border-collapse: collapse; }
        .stats-table th, .data-table th { background: #8B4513; color: white; padding: 10px; text-align: left; }
        .stats-table td, .data-table td { padding: 10px; border-bottom: 1px solid #d4a373; }
        .btn { display: inline-block; padding: 6px 12px; margin: 2px; border-radius: 8px; text-decoration: none; font-size: 12px; border: none; cursor: pointer; }
        .btn-edit { background: #DAA520; color: white; }
        .btn-delete { background: #8B0000; color: white; }
        .btn-save { background: #8B4513; color: white; padding: 10px 20px; }
        .btn-cancel { background: #999; color: white; }
        .success { background: #d4edda; color: #155724; padding: 12px; border-radius: 8px; margin-bottom: 20px; }
        .edit-form { background: #f5e6d3; border-radius: 15px; padding: 20px; margin-bottom: 30px; border: 2px solid #DAA520; }
        .edit-form input, .edit-form select, .edit-form textarea { width: 100%; padding: 8px; margin-top: 5px; border-radius: 8px; border: 1px solid #d4a373; }
        .admin-info { text-align: right; margin-bottom: 20px; }
        .data-table { display: block; overflow-x: auto; }
        .delete-form { display: inline; }
        .delete-form button { background: #8B0000; color: white; padding: 6px 12px; border: none; border-radius: 8px; cursor: pointer; font-size: 12px; }
        .delete-form button:hover { background: #660000; }
    </style>
</head>
<body>
<div class="container">
    <div class="admin-info">Вы вошли как администратор | <a href="index.html">Вернуться к сайту</a></div>
    <h1>Панель администратора Sweet Moments</h1>
    <?php if (isset($message)) echo $message; ?>
    
    <?php if ($edit_order): ?>
    <div class="edit-form">
        <h3>Редактирование заказа #<?= $edit_order['id'] ?></h3>
        <form method="POST">
            <input type="hidden" name="update_id" value="<?= $edit_order['id'] ?>">
            <div><label>Имя:</label><input type="text" name="name" value="<?= htmlspecialchars($edit_order['name']) ?>" required></div>
            <div><label>Телефон:</label><input type="text" name="phone" value="<?= htmlspecialchars($edit_order['phone']) ?>" required></div>
            <div><label>Email:</label><input type="email" name="email" value="<?= htmlspecialchars($edit_order['email']) ?>"></div>
            <div><label>Десерт:</label>
                <select name="dessert">
                    <option value="">Выберите</option>
                    <option value="chocolate-cake" <?= $edit_order['dessert']=='chocolate-cake'?'selected':'' ?>>Шоколадный торт</option>
                    <option value="macarons" <?= $edit_order['dessert']=='macarons'?'selected':'' ?>>Макаруны</option>
                    <option value="cupcakes" <?= $edit_order['dessert']=='cupcakes'?'selected':'' ?>>Капкейки</option>
                    <option value="red-velvet" <?= $edit_order['dessert']=='red-velvet'?'selected':'' ?>>Красный бархат</option>
                    <option value="other" <?= $edit_order['dessert']=='other'?'selected':'' ?>>Другой</option>
                </select>
            </div>
            <div><label>Дата получения:</label><input type="date" name="date" value="<?= $edit_order['date'] ?>"></div>
            <div><label>Количество персон:</label><input type="number" name="servings" value="<?= $edit_order['servings'] ?>"></div>
            <div><label>Пожелания:</label><textarea name="message" rows="4"><?= htmlspecialchars($edit_order['message']) ?></textarea></div>
            <button type="submit" class="btn btn-save">Сохранить</button>
            <a href="admin.php" class="btn btn-cancel">Отмена</a>
        </form>
    </div>
    <?php endif; ?>
    
    <h2>Статистика</h2>
    <div class="stat-card"><div class="number"><?= $total_orders ?></div><div class="label">Всего заказов</div></div>
    
    <div class="stats-table">
        <h3>Популярность десертов</h3>
        <table><thead><tr><th>Десерт</th><th>Количество</th></tr></thead><tbody>
        <?php foreach ($dessert_stats as $stat): ?>
        <tr><td><?= htmlspecialchars($stat['dessert'] ?: 'Не указан') ?></td><td><?= $stat['count'] ?></td></tr>
        <?php endforeach; ?>
        </tbody></table>
    </div>
    
    <h2>Все заказы</h2>
    <table class="data-table">
        <thead>
            <tr><th>ID</th><th>Имя</th><th>Телефон</th><th>Email</th><th>Десерт</th><th>Дата</th><th>Персон</th><th>Пожелания</th><th>Дата заказа</th><th>Действия</th></tr>
        </thead>
        <tbody>
        <?php foreach ($orders as $order): ?>
        <tr>
            <td><?= $order['id'] ?></td>
            <td><?= htmlspecialchars($order['name']) ?></td>
            <td><?= htmlspecialchars($order['phone']) ?></td>
            <td><?= htmlspecialchars($order['email']) ?></td>
            <td><?= htmlspecialchars($order['dessert'] ?: '-') ?></td>
            <td><?= $order['date'] ?: '-' ?></td>
            <td><?= $order['servings'] ?: '-' ?></td>
            <td><?= htmlspecialchars(substr($order['message'] ?? '', 0, 50)) ?>...</td>
            <td><?= $order['created_at'] ?></td>
            <td>
                <a href="?edit=<?= $order['id'] ?>" class="btn btn-edit">Ред.</a>
                <form method="POST" class="delete-form" onsubmit="return confirm('Удалить заказ #<?= $order['id'] ?>?')">
                    <input type="hidden" name="delete_id" value="<?= $order['id'] ?>">
                    <button type="submit">Удалить</button>
                </form>
            </td>
        </tr>
        <?php endforeach; ?>
        </tbody>
    </table>
</div>
</body>
</html>
