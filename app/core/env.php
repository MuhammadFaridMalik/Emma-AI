<?php
declare(strict_types=1);

/**
 * Parser .env sederhana tanpa dependency luar (tetap ringan sesuai prinsip project).
 * Format baris yang didukung: KEY=VALUE
 * Baris kosong dan baris yang diawali # akan diabaikan.
 *
 * @param string $path lokasi file .env
 */
function emma_load_env(string $path): void
{
    if (!is_file($path)) {
        return;
    }

    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    if ($lines === false) {
        return;
    }

    foreach ($lines as $line) {
        $line = trim($line);

        if ($line === '' || strpos($line, '#') === 0) {
            continue;
        }

        if (strpos($line, '=') === false) {
            continue;
        }

        [$key, $value] = explode('=', $line, 2);
        $key = trim($key);
        $value = trim($value, " \t\n\r\0\x0B\"'");

        if ($key !== '' && getenv($key) === false) {
            putenv($key . '=' . $value);
        }
    }
}