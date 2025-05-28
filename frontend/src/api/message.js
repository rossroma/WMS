import request from '@/utils/request'

// 获取消息列表
export function getMessageList(params) {
  return request({
    url: '/messages',
    method: 'get',
    params
  })
}

// 获取未读消息列表
export function getUnreadMessages() {
  return request({
    url: '/messages/unread',
    method: 'get'
  })
}

// 获取未读消息数量
export function getUnreadCount() {
  return request({
    url: '/messages/unread-count',
    method: 'get'
  })
}

// 标记消息为已读
export function markAsRead(id) {
  return request({
    url: `/messages/${  id  }/read`,
    method: 'put'
  })
}

// 标记所有消息为已读
export function markAllAsRead() {
  return request({
    url: '/messages/read-all',
    method: 'put'
  })
}

// 删除消息
export function deleteMessage(id) {
  return request({
    url: `/messages/${  id}`,
    method: 'delete'
  })
} 
