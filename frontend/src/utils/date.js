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
 * 格式化时间（不包含日期）
 * @param {string|Date} date - 日期字符串或Date对象
 * @returns {string} 格式化后的时间字符串 HH:mm:ss
 */
export function formatTimeOnly(date) {
  return formatDate(date, 'HH:mm:ss')
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
 * 相对时间格式化（如：刚刚、5分钟前、1小时前等）
 * @param {string|Date} date - 日期字符串或Date对象
 * @returns {string} 相对时间字符串
 */
export function formatRelativeTime(date) {
  if (!date) return ''
  
  const d = new Date(date)
  if (isNaN(d.getTime())) return ''
  
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  
  const minute = 60 * 1000
  const hour = 60 * minute
  const day = 24 * hour
  const month = 30 * day
  const year = 365 * day
  
  if (diff < minute) {
    return '刚刚'
  } else if (diff < hour) {
    return `${Math.floor(diff / minute)}分钟前`
  } else if (diff < day) {
    return `${Math.floor(diff / hour)}小时前`
  } else if (diff < month) {
    return `${Math.floor(diff / day)}天前`
  } else if (diff < year) {
    return `${Math.floor(diff / month)}个月前`
  } else {
    return `${Math.floor(diff / year)}年前`
  }
}

/**
 * 判断是否为今天
 * @param {string|Date} date - 日期字符串或Date对象
 * @returns {boolean} 是否为今天
 */
export function isToday(date) {
  if (!date) return false
  
  const d = new Date(date)
  if (isNaN(d.getTime())) return false
  
  const today = new Date()
  return d.toDateString() === today.toDateString()
}

/**
 * 判断是否为昨天
 * @param {string|Date} date - 日期字符串或Date对象
 * @returns {boolean} 是否为昨天
 */
export function isYesterday(date) {
  if (!date) return false
  
  const d = new Date(date)
  if (isNaN(d.getTime())) return false
  
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  return d.toDateString() === yesterday.toDateString()
}

/**
 * 智能日期格式化（今天显示时间，昨天显示"昨天 HH:mm"，其他显示完整日期）
 * @param {string|Date} date - 日期字符串或Date对象
 * @returns {string} 智能格式化后的日期字符串
 */
export function formatSmartDate(date) {
  if (!date) return ''
  
  if (isToday(date)) {
    return `今天 ${formatTimeOnly(date).substring(0, 5)}` // HH:mm
  } else if (isYesterday(date)) {
    return `昨天 ${formatTimeOnly(date).substring(0, 5)}` // HH:mm
  } else {
    return formatDateTime(date)
  }
}

/**
 * 获取今天的日期字符串
 * @param {string} format - 格式化模板，默认 'YYYY-MM-DD'
 * @returns {string} 今天的日期字符串
 */
export function getToday(format = 'YYYY-MM-DD') {
  return formatDate(new Date(), format)
}

/**
 * 获取指定天数前/后的日期
 * @param {number} days - 天数，正数为未来，负数为过去
 * @param {string} format - 格式化模板，默认 'YYYY-MM-DD'
 * @returns {string} 指定日期字符串
 */
export function getDateByDays(days, format = 'YYYY-MM-DD') {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return formatDate(date, format)
}

/**
 * Vue 组合式函数：提供日期格式化功能
 * @returns {object} 包含各种日期格式化方法的对象
 */
export function useDateFormat() {
  return {
    formatDate,
    formatDateOnly,
    formatTimeOnly,
    formatDateTime,
    formatRelativeTime,
    formatSmartDate,
    isToday,
    isYesterday,
    getToday,
    getDateByDays
  }
} 