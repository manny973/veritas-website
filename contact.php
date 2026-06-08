<?php
/* ============================================================
   Veritas Cyber Security — Contact form handler
   Receives the "Request a consult" POST, validates it server-side,
   and sends it to the team inbox via authenticated SMTP relay.
   Returns JSON: {"ok":true} or {"ok":false,"error":"..."}.
   ============================================================ */

/* -------- 1. CONFIG — EDIT THESE VALUES -------- */
$CONFIG = [
    // Where leads are delivered:
    'to'          => 'info@veritascybersec.com',
    'to_name'     => 'Veritas Cyber Security',

    // The "From" mailbox. For best deliverability this MUST be a real
    // mailbox on YOUR domain (create it in Hostinger → Emails), NOT the
    // visitor's address. The visitor's email goes in Reply-To instead.
    'from'        => 'noreply@veritascybersec.com',
    'from_name'   => 'Veritas Website',

    // SMTP relay credentials (Hostinger → Emails → Email Accounts → Connect Devices / SMTP):
    'smtp_host'   => 'smtp.hostinger.com',
    'smtp_user'   => 'noreply@veritascybersec.com', // the full mailbox address
    'smtp_pass'   => 'PUT-MAILBOX-PASSWORD-HERE',     // the mailbox password
    'smtp_port'   => 465,                              // 465 = SSL, 587 = STARTTLS
    'smtp_secure' => 'ssl',                            // 'ssl' for 465, 'tls' for 587
];

/* -------- 2. Only accept POST -------- */
header('Content-Type: application/json; charset=utf-8');
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Method not allowed.']);
    exit;
}

/* -------- 3. Honeypot: silently drop bots -------- */
if (!empty($_POST['company_website'])) {
    echo json_encode(['ok' => true]); // pretend success so the bot moves on
    exit;
}

/* -------- 4. Collect + validate -------- */
function field($key) { return isset($_POST[$key]) ? trim($_POST[$key]) : ''; }

$name    = field('name');
$company = field('company');
$email   = field('email');
$phone   = field('phone');
$service = field('service');
$size    = field('size');
$message = field('message');

$errors = [];
if ($name === '')    $errors[] = 'name';
if ($company === '') $errors[] = 'company';
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) $errors[] = 'email';
if ($message === '') $errors[] = 'message';

if ($errors) {
    http_response_code(422);
    echo json_encode(['ok' => false, 'error' => 'Please complete the required fields.']);
    exit;
}

/* basic header-injection guard */
foreach (['name', 'email', 'company'] as $k) {
    if (preg_match('/[\r\n]/', $$k)) {
        http_response_code(400);
        echo json_encode(['ok' => false, 'error' => 'Invalid input.']);
        exit;
    }
}

/* -------- 5. Build the message -------- */
$subject = 'New website inquiry — ' . ($company !== '' ? $company : $name);

$lines = [
    "New consultation request from veritascybersec.com",
    str_repeat('-', 48),
    "Name:              $name",
    "Company:           $company",
    "Email:             $email",
    "Phone:             " . ($phone !== '' ? $phone : '—'),
    "Company size:      " . ($size !== '' ? $size : '—'),
    "Service interest:  " . ($service !== '' ? $service : '—'),
    "",
    "Message:",
    $message,
    "",
    str_repeat('-', 48),
    "Submitted: " . date('Y-m-d H:i:s T'),
    "IP: " . ($_SERVER['REMOTE_ADDR'] ?? 'unknown'),
];
$body = implode("\r\n", $lines);

/* -------- 6. Send via SMTP (PHPMailer if available, else mail()) -------- */
$sent = false;
$autoload = __DIR__ . '/vendor/autoload.php';      // Composer install
$manual   = __DIR__ . '/PHPMailer/src/PHPMailer.php'; // manual upload

if (file_exists($autoload) || file_exists($manual)) {
    if (file_exists($autoload)) {
        require $autoload;
    } else {
        require __DIR__ . '/PHPMailer/src/Exception.php';
        require __DIR__ . '/PHPMailer/src/PHPMailer.php';
        require __DIR__ . '/PHPMailer/src/SMTP.php';
    }
    try {
        $mail = new PHPMailer\PHPMailer\PHPMailer(true);
        $mail->isSMTP();
        $mail->Host       = $CONFIG['smtp_host'];
        $mail->SMTPAuth   = true;
        $mail->Username   = $CONFIG['smtp_user'];
        $mail->Password   = $CONFIG['smtp_pass'];
        $mail->SMTPSecure = $CONFIG['smtp_secure'];
        $mail->Port       = (int) $CONFIG['smtp_port'];

        $mail->setFrom($CONFIG['from'], $CONFIG['from_name']);
        $mail->addAddress($CONFIG['to'], $CONFIG['to_name']);
        $mail->addReplyTo($email, $name);   // reply goes straight to the lead
        $mail->Subject = $subject;
        $mail->Body    = $body;

        $mail->send();
        $sent = true;
    } catch (Exception $e) {
        $sent = false;
    }
} else {
    /* Fallback: PHP mail() via the server's local relay.
       Works on most Hostinger plans, but SMTP above is preferred. */
    $headers  = 'From: ' . $CONFIG['from_name'] . ' <' . $CONFIG['from'] . ">\r\n";
    $headers .= 'Reply-To: ' . $name . ' <' . $email . ">\r\n";
    $headers .= "Content-Type: text/plain; charset=utf-8\r\n";
    $sent = @mail($CONFIG['to'], $subject, $body, $headers);
}

/* -------- 7. Respond -------- */
if ($sent) {
    echo json_encode(['ok' => true]);
} else {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'The message could not be sent. Please email us directly.']);
}
