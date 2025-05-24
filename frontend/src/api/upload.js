import request from '@/utils/request'

// 获取上传凭证（用于前端直传七牛云，如需要）
export function getUploadToken() {
  return request({
    url: '/upload/token',
    method: 'get'
  })
}

// 上传文件到服务器（服务器会转存到七牛云）
export function uploadFile(file) {
  const formData = new FormData()
  formData.append('file', file)
  
  return request({
    url: '/upload',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    timeout: 30000 // 上传文件可能需要更长时间
  })
}
