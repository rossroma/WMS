/**
 * 日期时间格式化工具 - 基于 day.js
 */
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'

// 配置 day.js
dayjs.extend(relativeTime)
dayjs.locale('zh-cn')

/**
 * 格式化日期时间
 * @param {string|Date} date - 日期字符串或Date对象
 * @param {string} format - 格式化模板，默认 'YYYY-MM-DD HH:mm:ss'
 * @returns {string} 格式化后的日期字符串
 */
export function formatDate(date, format = 'YYYY-MM-DD HH:mm:ss') {
  if (!date) return ''
  
  const d = dayjs(date)
  if (!d.isValid()) return ''
  
  return d.format(format)
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
 * 相对时间格式化（如：刚刚、5分钟前、1小时前等）
 * @param {string|Date} date - 日期字符串或Date对象
 * @returns {string} 相对时间字符串
 */
export function formatRelativeTime(date) {
  if (!date) return ''
  
  const d = dayjs(date)
  if (!d.isValid()) return ''
  
  return d.fromNow()
}

/**
 * 获取今天的日期字符串
 * @param {string} format - 格式化模板，默认 'YYYY-MM-DD'
 * @returns {string} 今天的日期字符串
 */
export function getToday(format = 'YYYY-MM-DD') {
  return dayjs().format(format)
}
