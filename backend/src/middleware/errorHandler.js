module.exports = (err, req, res, next) => {
  // 1. Логируем ошибку в консоль сервера (для тебя)
  console.error('GLOBAL ERROR:', err.message);
  console.error(err.stack); // Стек вызовов, чтобы найти, где упало

  const statusCode = err.statusCode || 500;

  // 3. Отправляем красивый JSON ответ клиенту
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Что-то пошло не так на сервере',
    // stack: err.stack // Раскомментируй только при отладке, не показывай в проде
  });
};