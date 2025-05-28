/**
 * 日期时间格式化工具
 */

/**
 * 格式化日期时间
 * @param {string|Date} date - 日期字符串或Date对象
 * @param {string} format - 格式化模板，默认 'YYYY-MM-DD HH:mm:ss'
 * @returns {string} 格式化后的日期字符串
 */
export function formatDate(date, format = 'YYYY-MM-DD HH:mm:ss') {
  if (!date) return ''
  
  const d = new Date(date)
  if (isNaN(d.getTime())) return ''
  
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  const seconds = String(d.getSeconds()).padStart(2, '0')
  
  return format
    .replace('YYYY', year)
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds)
}

/**
 * 格式化日期（不包含时间）
 * @param {string|Date} date - 日期字符串或Date对象
 * @returns {string} 格式化后的日期字符串 YYYY-MM-DD
 */
export function formatDateOnly(date) {
  return formatDate(date, 'YYYY-MM-DD')
}

/**
 * 格式化日期时间（精确到分钟）
 * @param {string|Date} date - 日期字符串或Date对象
 * @returns {string} 格式化后的日期时间字符串 YYYY-MM-DD HH:mm
 */
export function formatDateTime(date) {
  return formatDate(date, 'YYYY-MM-DD HH:mm')
}

/**
 * 获取今天的日期字符串
 * @param {string} format - 格式化模板，默认 'YYYY-MM-DD'
 * @returns {string} 今天的日期字符串
 */
export function getToday(format = 'YYYY-MM-DD') {
  return formatDate(new Date(), format)
}
