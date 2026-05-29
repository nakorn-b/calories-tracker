import { get, post, del, patch } from './api'


export const getUser = async () => get('/user')

export const updateUserTargets = async (targets: { target_calories?: number, target_protein?: number }) => 
  patch('/user/targets', targets)