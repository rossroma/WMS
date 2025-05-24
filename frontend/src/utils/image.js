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
    mode = 1, // 1: 限定缩略图的宽最多为<Width>，高最多为<Height>，进行等比缩放
    quality = 85 // 图片质量，取值范围1-100
  } = options

  // 检查是否是七牛云URL（包含七牛云域名）
  const qiniuDomains = [
    '.qiniucdn.com',
    '.rossroma.com'
  ]
  
  // 或者包含环境变量中配置的七牛云域名
  const configDomain = import.meta.env.VITE_QINIU_DOMAIN
  
  let isQiniuUrl = qiniuDomains.some(domain => imageUrl.includes(domain))
  
  // 如果配置了七牛云域名，也检查是否匹配
  if (!isQiniuUrl && configDomain) {
    isQiniuUrl = imageUrl.includes(configDomain)
  }
  
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
    mode: 1, // 限定缩略图的宽和高分别最多为Width和Height，进行等比缩放，居中裁剪
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
export function getProportionalThumbnail(imageUrl, maxSize = 1000, quality = 85) {
  return getQiniuThumbnail(imageUrl, {
    width: maxSize,
    height: maxSize,
    mode: 2, // 限定缩略图的宽最多为Width，高最多为Height，进行等比缩放
    quality
  })
}

/**
 * 为列表页生成小正方形缩略图
 * @param {string} imageUrl - 原始图片URL
 * @returns {string} 小正方形缩略图URL
 */
export function getListThumbnail(imageUrl) {
  return getSquareThumbnail(imageUrl, 40, 85)
}

/**
 * 为预览生成中等大小等比例缩略图
 * @param {string} imageUrl - 原始图片URL
 * @returns {string} 中等等比例缩略图URL
 */
export function getPreviewThumbnail(imageUrl) {
  return getProportionalThumbnail(imageUrl, 800, 90)
} 