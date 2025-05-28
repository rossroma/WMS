import request from '@/utils/request'
import axios from 'axios'

// 获取上传凭证
export function getUploadToken() {
  return request({
    url: '/upload/token',
    method: 'get'
  })
}

// 直传文件到七牛云
export async function uploadFile(file) {
  try {
    // 1. 获取上传凭证
    const tokenResponse = await getUploadToken()
    if (tokenResponse.status !== 'success') {
      throw new Error(tokenResponse.message || '获取上传凭证失败')
    }

    const { token, domain, useHttps, keyPrefix } = tokenResponse.data
    
    // 2. 生成文件key
    const ext = file.name.split('.').pop()
    const key = `${keyPrefix}.${ext}`
    
    // 3. 构建上传表单数据
    const formData = new FormData()
    formData.append('key', key)
    formData.append('token', token)
    formData.append('file', file)
    
    // 4. 直传到七牛云
    const uploadResponse = await axios.post('https://upload.qiniup.com', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      timeout: 30000
    })
    
    // 5. 构建文件URL
    const protocol = useHttps ? 'https' : 'http'
    const url = `${protocol}://${domain}/${uploadResponse.data.key}`
    
    return {
      status: 'success',
      message: '文件上传成功',
      data: {
        url,
        key: uploadResponse.data.key
      }
    }
  } catch (error) {
    console.error('上传失败:', error)
    
    // 处理不同类型的错误
    let errorMessage = '文件上传失败，请重试'
    
    if (error.response) {
      const { status, data } = error.response
      if (status === 413) {
        errorMessage = '文件过大，请选择较小的文件'
      } else if (status === 400) {
        errorMessage = data.error || '上传参数错误'
      } else if (data && data.error) {
        errorMessage = data.error
      }
    } else if (error.code === 'ECONNABORTED') {
      errorMessage = '上传超时，请检查网络连接'
    } else if (error.message) {
      errorMessage = error.message
    }
    
    throw new Error(errorMessage)
  }
}
