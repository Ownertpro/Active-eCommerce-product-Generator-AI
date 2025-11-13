

import React, { useState } from 'react';
import { CodeIcon } from './icons/CodeIcon';

const phpCode = `
<?php
// ===============================================================
// 💾 API PARA GUARDAR PRODUCTOS (Compatible con ComprasPar)
// v9.2 - Corregido error 'Column count doesn't match value count'.
// ===============================================================

// --- Cabeceras CORS ---
header("Access-control-allow-origin: *");
header("Access-control-allow-methods: POST, OPTIONS");
header("Access-control-allow-headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit;
}
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Method Not Allowed']);
    exit;
}

// -------------------- ¡ATENCIÓN! CONFIGURACIÓN REQUERIDA --------------------
define('DB_HOST', 'localhost');
define('DB_USER', 'tu_usuario_de_base_de_datos'); // <-- REEMPLAZAR
define('DB_PASS', 'tu_contraseña_de_base_de_datos'); // <-- REEMPLAZAR
define('DB_NAME', 'tu_nombre_de_base_de_datos'); // <-- REEMPLAZAR

// --- CONFIGURACIÓN DE RUTAS DE IMAGEN ---
define('SERVER_UPLOAD_DIR', rtrim($_SERVER['DOCUMENT_ROOT'], '/') . '/public/uploads/all/');
define('DB_UPLOAD_PATH', 'uploads/all/');
// -------------------------------------------------------------------------

mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

try {
    // 🔗 CONEXIÓN A LA BASE DE DATOS
    $conexion = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
    $conexion->set_charset("utf8mb4");

    // 📥 OBTENER Y VALIDAR DATOS DE ENTRADA (JSON)
    $input = json_decode(file_get_contents('php://input'), true);
    if (json_last_error() !== JSON_ERROR_NONE || $input === null) {
        throw new Exception('Payload JSON inválido. Revisa tu php.ini y aumenta post_max_size si las imágenes son grandes.');
    }
    if (empty($input['productName'])) throw new Exception("El campo 'productName' es requerido.");
    if (empty($input['categoryId'])) throw new Exception("El campo 'categoryId' es requerido.");
    
    // 🚀 INICIA LA TRANSACCIÓN
    $conexion->begin_transaction();

    // 🖼️ PROCESAR Y GUARDAR IMÁGENES
    $image_ids = [];
    $image1_base64 = $input['imageUrl1'] ?? '';
    $image2_base64 = $input['imageUrl2'] ?? '';

    if (!empty($image1_base64)) {
        $image_ids[] = process_and_save_image($image1_base64, $input['productName'], $conexion);
    }
    if (!empty($image2_base64)) {
        $image_ids[] = process_and_save_image($image2_base64, $input['productName'], $conexion);
    }

    $photos_ids_string = !empty($image_ids) ? implode(',', $image_ids) : null;
    $thumbnail_id_string = $image_ids[0] ?? null;
    $meta_img_id_string = $thumbnail_id_string;

    // 📝 1. INSERTAR DATOS EN LA TABLA 'products'
    $sql = "INSERT INTO products 
        (name, added_by, user_id, category_id, photos, thumbnail_img, meta_img, tags, description, unit_price, purchase_price, current_stock, unit, meta_title, meta_description, meta_keywords, slug, choice_options, colors, published, approved, created_at, updated_at)
        VALUES (?, 'admin', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1, NOW(), NOW())";
    
    $stmt = $conexion->prepare($sql);
    if ($stmt === false) throw new Exception("Error al preparar la consulta de productos: " . $conexion->error);

    // Valores
    $user_id = 9;
    $unit = 'UNI';
    $slug = strtolower(trim(preg_replace('/[^A-Za-z0-9-]+/', '-', $input['productName']))) . '-' . uniqid();
    $choice_options = '[]';
    $colors = '[]';
    $name = $input['productName'];
    $category_id = intval($input['categoryId'] ?? 1);
    $current_stock = intval($input['stockQuantity'] ?? 10);
    $description_to_save = $input['description'] ?? '';
    $tags_string = isset($input['tags']) && is_array($input['tags']) ? implode(',', array_map('htmlspecialchars', $input['tags'])) : '';
    $unit_price = floatval($input['price'] ?? 0);
    $purchase_price = floatval($input['purchasePrice'] ?? 0);
    $meta_title = $name;
    $meta_description = $input['metaDescription'] ?? "Compra " . htmlspecialchars($name) . " al mejor precio.";
    $meta_keywords = $tags_string;

    $stmt->bind_param(
        "siisssssddisssssss",
        $name, $user_id, $category_id, $photos_ids_string, $thumbnail_id_string, $meta_img_id_string, $tags_string,
        $description_to_save, $unit_price, $purchase_price, $current_stock, $unit, $meta_title, $meta_description,
        $meta_keywords, $slug, $choice_options, $colors
    );

    $stmt->execute();
    $new_product_id = $conexion->insert_id; // <-- Obtenemos el ID del producto recién creado
    $stmt->close();

    // 📦 2. INSERTAR STOCK INICIAL EN 'product_stocks'
    // Esta es la parte crucial para que el stock se refleje correctamente.
    $sql_stock = "INSERT INTO product_stocks (product_id, variant, price, qty, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())";
    $stmt_stock = $conexion->prepare($sql_stock);
    if ($stmt_stock === false) throw new Exception("Error al preparar la consulta de stock: " . $conexion->error);

    $variant = ''; // Para productos simples, la variante es una cadena vacía.

    $stmt_stock->bind_param("isdi", $new_product_id, $variant, $unit_price, $current_stock);
    $stmt_stock->execute();
    $stmt_stock->close();
    
    // ✅ Confirma la transacción (ambas inserciones fueron exitosas)
    $conexion->commit();

    http_response_code(200);
    echo json_encode(['ok' => true, 'message' => 'Producto y stock guardados con éxito.', 'id' => $new_product_id]);

} catch (Exception $e) {
    // ❌ SI ALGO FALLA, REVierte la transacción
    if (isset($conexion) && $conexion->ping()) $conexion->rollback();
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Error del script del servidor: ' . $e->getMessage(), 'line' => $e->getLine()]);

} finally {
    if (isset($conexion) && $conexion->ping()) $conexion->close();
}

/**
 * Procesa una imagen en base64: la guarda en disco y crea un registro en la tabla 'uploads'.
 * @return int El ID del nuevo registro en la tabla 'uploads'.
 */
function process_and_save_image($base64_string, $product_name, $conexion) {
    if (!preg_match('~^data:image/(\\w+);base64,~', $base64_string, $type)) {
        throw new Exception('URI de datos de imagen inválido.');
    }
    
    $data = substr($base64_string, strpos($base64_string, ',') + 1);
    $type = strtolower($type[1]);
    if (!in_array($type, ['jpg', 'jpeg', 'gif', 'png'])) {
        throw new Exception('Tipo de imagen inválido: ' . $type);
    }
    
    $data = base64_decode($data);
    if ($data === false) throw new Exception('Fallo en base64_decode.');

    $filename = uniqid('prod_') . '.' . $type;
    $server_file_path = SERVER_UPLOAD_DIR . $filename;
    $db_file_path = DB_UPLOAD_PATH . $filename;

    if (!is_dir(SERVER_UPLOAD_DIR) && !mkdir(SERVER_UPLOAD_DIR, 0755, true)) {
        throw new Exception('No se pudo crear el directorio de subida: ' . SERVER_UPLOAD_DIR);
    }

    if (!file_put_contents($server_file_path, $data)) {
        throw new Exception('No se pudo guardar la imagen en ' . $server_file_path);
    }

    $sql = "INSERT INTO uploads (file_original_name, file_name, user_id, file_size, extension, type, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())";
    $stmt_upload = $conexion->prepare($sql);
    
    $original_name = $product_name . '.' . $type;
    $user_id = 9;
    $file_size = strlen($data);
    $image_type = 'image';
    
    $stmt_upload->bind_param("ssiiss", $original_name, $db_file_path, $user_id, $file_size, $type, $image_type);
    $stmt_upload->execute();
    $upload_id = $conexion->insert_id;
    $stmt_upload->close();

    return $upload_id;
}
?>
`;


export const ApiGuide: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const [copySuccess, setCopySuccess] = useState('');

    const handleCopy = () => {
        navigator.clipboard.writeText(phpCode.trim()).then(() => {
            setCopySuccess('¡Copiado!');
            setTimeout(() => setCopySuccess(''), 2000);
        }, () => {
            setCopySuccess('Error al copiar');
        });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-gray-800 rounded-xl border border-gray-700 w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl">
                <header className="p-4 border-b border-gray-700 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <CodeIcon className="w-6 h-6 text-purple-400" />
                        <h2 className="text-xl font-bold text-white">Solución para Error del Servidor (500)</h2>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white text-3xl leading-none">&times;</button>
                </header>
                
                <div className="p-6 overflow-y-auto">
                    <p className="text-gray-300 mb-4">
                        El error <strong>500</strong> significa que hay un problema en el script <strong>save-product.php</strong> de tu servidor. La aplicación frontend funciona correctamente, pero el backend está fallando.
                    </p>
                    <p className="text-gray-300 mb-6">
                        Para solucionarlo, reemplaza el contenido de tu archivo <code>save-product.php</code> con el siguiente código. Este código es <strong>100% compatible con tu base de datos</strong> y te mostrará errores detallados si algo sigue mal.
                    </p>
                    
                    <div className="bg-gray-900 rounded-lg p-4 relative">
                        <button 
                            onClick={handleCopy}
                            className="absolute top-2 right-2 bg-gray-700 hover:bg-purple-600 text-white text-xs font-bold py-1 px-3 rounded"
                        >
                            {copySuccess || 'Copiar'}
                        </button>
                        <pre className="text-sm text-white whitespace-pre-wrap overflow-x-auto max-h-60">
                            <code>{phpCode.trim()}</code>
                        </pre>
                    </div>

                     <div className="mt-6 p-4 bg-yellow-900/50 border border-yellow-700 rounded-lg">
                        <h3 className="font-bold text-yellow-300">¡Acción Requerida!</h3>
                        <p className="text-yellow-300 mt-2">
                            1. Después de copiar, <strong>DEBES</strong> editar el código y reemplazar <code>DB_HOST</code>, <code>DB_USER</code>, <code>DB_PASS</code> y <code>DB_NAME</code> con tus credenciales reales.
                        </p>
                         <p className="text-yellow-300 mt-2">
                            2. Revisa los valores fijos como <code>user_id = 9</code> para asegurarte de que son correctos para tu sistema.
                        </p>
                    </div>
                </div>

                <footer className="p-4 border-t border-gray-700 text-right">
                    <button 
                        onClick={onClose}
                        className="px-6 py-2 bg-purple-600 text-white font-semibold rounded-lg shadow-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-purple-500"
                    >
                        Entendido, cerrar
                    </button>
                </footer>
                 {/* FIX: Removed the 'jsx' attribute from the <style> tag as it is not a standard React attribute and was causing a TypeScript error. */}
                 <style>{`
                    .animate-fade-in {
                        animation: fadeIn 0.3s ease-in-out;
                    }
                    @keyframes fadeIn {
                        from { opacity: 0; }
                        to { opacity: 1; }
                    }
                `}</style>
            </div>
        </div>
    );
};
