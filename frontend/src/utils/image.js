/**
 * 图片处理工具函数
 */

/**
 * 生成七牛云缩略图URL
 * @param {string} imageUrl - 原始图片URL
 * @param {object} options - 缩略图选项
 * @returns {string} 缩略图URL
 */
export function getQiniuThumbnail(imageUrl, options = {}) {
  if (!imageUrl) {
    return ''
  }

  const {
    width = 200,
    height = 200,
    mode = 1, // 1: 正方形 2: 长边等比例缩放
    quality = 85 // 图片质量
  } = options

  // 检查是否是七牛云URL（包含七牛云域名）
  const qiniuDomains = [
    '.qiniucdn.com',
    '.rossroma.com'
  ]

  const isQiniuUrl = qiniuDomains.some(domain => imageUrl.includes(domain))

  if (!isQiniuUrl) {
    // 如果不是七牛云URL，直接返回原URL
    return imageUrl
  }

  // 检查URL是否已经包含图片处理参数
  if (imageUrl.includes('?imageView2/') || imageUrl.includes('?imageMogr2/')) {
    // 如果已有处理参数，替换它们
    const baseUrl = imageUrl.split('?')[0]
    const params = `?imageView2/${mode}/w/${width}/h/${height}/q/${quality}`
    return baseUrl + params
  }

  // 生成七牛云图片处理参数
  const params = `?imageView2/${mode}/w/${width}/h/${height}/q/${quality}`
  
  return imageUrl + params
}

/**
 * 生成正方形缩略图（居中裁剪）
 * @param {string} imageUrl - 原始图片URL
 * @param {number} size - 正方形边长，默认200
 * @param {number} quality - 图片质量，默认85
 * @returns {string} 正方形缩略图URL
 */
export function getSquareThumbnail(imageUrl, size = 200, quality = 85) {
  return getQiniuThumbnail(imageUrl, {
    width: size,
    height: size,
    mode: 1,
    quality
  })
}

/**
 * 生成等比例缩略图（按长边缩放）
 * @param {string} imageUrl - 原始图片URL
 * @param {number} maxSize - 长边最大尺寸，默认800
 * @param {number} quality - 图片质量，默认85
 * @returns {string} 等比例缩略图URL
 */
export function getPreviewThumbnail(imageUrl, maxSize = 1000, quality = 85) {
  return getQiniuThumbnail(imageUrl, {
    width: maxSize,
    height: maxSize,
    mode: 2,
    quality
  })
}
