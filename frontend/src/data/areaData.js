// 完整的中国省市区数据（使用在线API数据）
import completeAreaData from './complete-area-data.js'

// 导出完整的省市区数据
export const areaData = completeAreaData

// 根据地址字符串解析省市区
export function parseAddress(addressStr) {
  if (!addressStr) return { province: '', city: '', district: '' }
  
  let province = '', city = '', district = ''
  
  for (const prov of areaData) {
    if (addressStr.includes(prov.text)) {
      province = prov.value
      
      for (const c of prov.children || []) {
        if (addressStr.includes(c.text)) {
          city = c.value
          
          for (const d of c.children || []) {
            if (addressStr.includes(d.text)) {
              district = d.value
              break
            }
          }
          break
        }
      }
      break
    }
  }
  
  return { province, city, district }
}

// 根据省市区代码获取完整地址字符串
export function getAddressString(province, city, district) {
  let result = ''
  
  for (const prov of areaData) {
    if (prov.value === province) {
      result += prov.text
      
      for (const c of prov.children || []) {
        if (c.value === city) {
          result += c.text
          
          for (const d of c.children || []) {
            if (d.value === district) {
              result += d.text
              break
            }
          }
          break
        }
      }
      break
    }
  }
  
  return result
}

// 根据省市区代码获取对应的名称
export function getAreaNames(province, city, district) {
  let provinceName = '', cityName = '', districtName = ''
  
  for (const prov of areaData) {
    if (prov.value === province) {
      provinceName = prov.text
      
      for (const c of prov.children || []) {
        if (c.value === city) {
          cityName = c.text
          
          for (const d of c.children || []) {
            if (d.value === district) {
              districtName = d.text
              break
            }
          }
          break
        }
      }
      break
    }
  }
  
  return { provinceName, cityName, districtName }
}

// 获取所有省份列表
export function getProvinces() {
  return areaData.map(item => ({
    value: item.value,
    label: item.text
  }))
}

// 根据省份代码获取城市列表
export function getCitiesByProvince(provinceValue) {
  const province = areaData.find(item => item.value === provinceValue)
  if (!province || !province.children) return []
  
  return province.children.map(item => ({
    value: item.value,
    label: item.text
  }))
}

// 根据城市代码获取区县列表
export function getDistrictsByCity(provinceValue, cityValue) {
  const province = areaData.find(item => item.value === provinceValue)
  if (!province || !province.children) return []
  
  const city = province.children.find(item => item.value === cityValue)
  if (!city || !city.children) return []
  
  return city.children.map(item => ({
    value: item.value,
    label: item.text
  }))
} 
