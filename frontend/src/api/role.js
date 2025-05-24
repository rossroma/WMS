import request from '@/utils/request'

// 获取角色列表
export function getRoleList() {
  return request({
    url: '/roles',
    method: 'get'
  })
}

// 创建角色
export function createRole(data) {
  return request({
    url: '/roles',
    method: 'post',
    data
  })
}

// 更新角色
export function updateRole(id, data) {
  return request({
    url: '/roles/' + id,
    method: 'put',
    data
  })
}

// 删除角色
export function deleteRole(id) {
  return request({
    url: '/roles/' + id,
    method: 'delete'
  })
}

// 分配角色
export function assignRoles(userId, data) {
  return request({
    url: `/roles/assign`,
    method: 'post',
    data: {
      userId,
      roleIds: data.roleIds
    }
  })
}