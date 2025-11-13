

import React, { useState } from 'react';
import { CodeIcon } from './icons/CodeIcon';

const phpCode = `
<?php
// ===============================================================
// 📡 API PARA OBTENER CATEGORÍAS
// v1.1 - Se añade alias 'parent_id as parentId' para compatibilidad directa.
// ===============================================================

// --- Cabeceras CORS ---
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

// -------------------- ¡ATENCIÓN! CONFIGURACIÓN REQUERIDA --------------------
define('DB_HOST', 'localhost');
define('DB_USER', 'tu_usuario_de_base_de_datos'); // <-- REEMPLAZAR
define('DB_PASS', 'tu_contraseña_de_base_de_datos'); // <-- REEMPLAZAR
define('DB_NAME', 'tu_nombre_de_base_de_datos'); // <-- REEMPLAZAR
// -------------------------------------------------------------------------

mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

try {
    // 🔗 CONEXIÓN A LA BASE DE DATOS
    $conexion = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
    $conexion->set_charset("utf8mb4");

    // 쿼리 CONSULTA PARA OBTENER LAS CATEGORÍAS
    // Usamos un alias 'parent_id as parentId' para que coincida con el frontend.
    $sql = "SELECT id, parent_id as parentId, level, name FROM categories ORDER BY parent_id, id";
    $result = $conexion->query($sql);

    // 📦 PREPARAR LOS DATOS PARA ENVIAR
    $categories = [];
    while ($row = $result->fetch_assoc()) {
        $row['id'] = (int)$row['id'];
        $row['parentId'] = (int)$row['parentId'];
        $row['level'] = (int)$row['level'];
        $categories[] = $row;
    }

    // ✅ ENVIAR RESPUESTA EXITOSA
    echo json_encode(['ok' => true, 'data' => $categories]);

} catch (Exception $e) {
    // ❌ ENVIAR RESPUESTA DE ERROR
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Error del servidor: ' . $e->getMessage(), 'line' => $e->getLine()]);

} finally {
    // 🚪 CERRAR LA CONEXIÓN
    if (isset($conexion) && $conexion->ping()) {
        $conexion->close();
    }
}
?>
`;


export const CategoriesApiGuide: React.FC<{ onClose: () => void }> = ({ onClose }) => {
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
                        <h2 className="text-xl font-bold text-white">Solución para Carga de Categorías (Error 500)</h2>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white text-3xl leading-none">&times;</button>
                </header>
                
                <div className="p-6 overflow-y-auto">
                    <p className="text-gray-300 mb-4">
                        El error <strong>500</strong> al cargar las categorías indica un problema en tu script <strong>get-categories.php</strong>. Esto suele ocurrir por credenciales de base de datos incorrectas.
                    </p>
                    <p className="text-gray-300 mb-6">
                        Para solucionarlo, reemplaza el contenido de tu archivo <code>get-categories.php</code> en tu servidor con el siguiente código.
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
                           1. Después de copiar, <strong>DEBES</strong> editar las 4 líneas de configuración (<code>DB_HOST</code>, <code>DB_USER</code>, <code>DB_PASS</code>, <code>DB_NAME</code>) con tus credenciales reales.
                        </p>
                         <p className="text-yellow-300 mt-2">
                           2. Asegúrate de que tu tabla se llame <code>categories</code> y tenga las columnas <code>id</code>, <code>parent_id</code>, <code>level</code> y <code>name</code>.
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