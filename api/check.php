<?php
header('Content-Type: application/json; charset=utf-8');
session_start();

if (isset($_SESSION['user_id'])) {
    echo json_encode(['success' => true, 'logged_in' => true, 'user_id' => $_SESSION['user_id'], 'login' => $_SESSION['login'] ?? null]);
} else {
    echo json_encode(['success' => true, 'logged_in' => false]);
}
?>
