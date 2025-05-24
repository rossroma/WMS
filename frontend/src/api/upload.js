import request from '@/utils/request'

// 上传文件
export function uploadFile(data) {
  return request({
    url: '/upload',
    method: 'post',
    data,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

// 删除文件
export function deleteFile(fileId) {
  return request({
    url: '/upload/' + fileId,
    method: 'delete'
  })
} 