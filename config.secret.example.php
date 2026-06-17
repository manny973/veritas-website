<?php
/* ============================================================
   config.secret.example.php  —  TEMPLATE (safe to commit)
   ------------------------------------------------------------
   FIRST DEPLOY ONLY, on the SERVER:
     1. Copy this file to:  config.secret.php
            cp config.secret.example.php config.secret.php
     2. Fill in your real SMTP password (and adjust any values).
     3. Save. Done.

   config.secret.php is git-ignored, so it is never overwritten by
   a `git pull` / deploy. Your email credentials stay safe across
   every future push.

   Any key you set here OVERRIDES the matching default in contact.php.
   You usually only need smtp_pass (and maybe smtp_user / from).
   ============================================================ */

return [
    // The mailbox password for the SMTP user below:
    'smtp_pass'   => 'PUT-YOUR-REAL-MAILBOX-PASSWORD-HERE',

    // Override any of these only if they differ from contact.php defaults:
    // 'to'          => 'info@veritascybersec.com',
    // 'from'        => 'noreply@veritascybersec.com',
    // 'smtp_host'   => 'smtp.hostinger.com',
    // 'smtp_user'   => 'noreply@veritascybersec.com',
    // 'smtp_port'   => 465,     // 465 = SSL, 587 = STARTTLS
    // 'smtp_secure' => 'ssl',   // 'ssl' for 465, 'tls' for 587
];
