<template>
  <div v-if="isOpen" class="modal-overlay" @click.self="closeModal">
    <div class="modal-content">
      <div class="modal-header">
        <h3>Создать пользователя</h3>
        <button @click="closeModal" class="modal-close" type="button"><i class="pi pi-times"></i></button>
      </div>

      <div class="modal-body">
        <div class="form-group" :class="{ 'has-error': usernameError }">
          <label>Логин</label>
          <input v-model="newUser.username" @input="usernameError=''" placeholder="Введите логин" />
          <span v-if="usernameError" class="field-error">{{ usernameError }}</span>
        </div>

        <div class="form-group" :class="{ 'has-error': emailError }">
          <label>Email</label>
          <input type="text" v-model="newUser.email" @input="emailError=''" placeholder="example@mail.com" />
          <span v-if="emailError" class="field-error">{{ emailError }}</span>
        </div>

        <div class="form-group" :class="{ 'has-error': passwordError }">
          <label>Пароль</label>
          <input type="password" v-model="newUser.password" @input="passwordError=''" placeholder="••••••••" />
          <span v-if="passwordError" class="field-error">{{ passwordError }}</span>
        </div>

        <div class="form-group">
          <label>Имя</label>
          <input type="text" v-model="newUser.firstName" placeholder="Иван" />
        </div>

        <div class="form-group">
          <label>Фамилия</label>
          <input type="text" v-model="newUser.lastName" placeholder="Иванов" />
        </div>

        <div class="form-group">
          <label>Должность</label>
          <input type="text" v-model="newUser.position" placeholder="Пекарь" />
        </div>

        <div class="form-group">
          <label>Роль</label>
          <select v-model="newUser.roles">
            <option value="" disabled>Выберите роль</option>
            <option v-for="role in roleOptions" :key="role.value" :value="role.value">{{ role.label }}</option>
          </select>
        </div>
      </div>

      <div class="modal-actions">
        <button @click="createUser" class="btn-primary" type="button" :disabled="isSubmitting">{{ isSubmitting ? 'Создание...' : 'Создать' }}</button>
        <button @click="closeModal" class="btn-secondary" type="button">Отмена</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { useUserStore } from '@/stores/user';
import { useToast } from 'primevue/usetoast'

const toast = useToast()
const userStore = useUserStore();
const newUser = ref({ username:'', email:'', password:'', firstName:'', lastName:'', position:'', roles:'' })
const roleOptions = [ { label:'USER_ADMIN', value:'USER_ADMIN' }, { label:'CAFE_ADMIN', value:'CAFE_ADMIN' }, { label:'STAFF', value:'STAFF' } ]
const emit = defineEmits(['close','success'])
const props = defineProps({ isOpen: Boolean })
const internalVisible = ref(false)
const isSubmitting = ref(false)
const emailError = ref('')
const usernameError = ref('')
const passwordError = ref('')
function isValidEmail(e) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) }
watch(()=>props.isOpen, v=>{ internalVisible.value=v })
watch(internalVisible, v=>{ if (!v) emit('close') })
function closeModal() { internalVisible.value=false; emit('close') }
function resetForm() { newUser.value={ username:'', email:'', password:'', firstName:'', lastName:'', position:'', roles:'' }; emailError.value=''; usernameError.value=''; passwordError.value='' }
async function createUser() {
  if (isSubmitting.value) return
  if (!newUser.value.roles) { toast.add({severity:'warn',summary:'Внимание',detail:'Выберите роль!',life:3000}); return }
  if (!newUser.value.username||newUser.value.username.length<3||newUser.value.username.length>20) { usernameError.value='Логин от 3 до 20 символов'; return }
  if (!isValidEmail(newUser.value.email)) { emailError.value='Введите корректный email'; return }
  if (!newUser.value.password||newUser.value.password.length<6||newUser.value.password.length>40) { passwordError.value='Пароль от 6 до 40 символов'; return }
  isSubmitting.value=true
  try { await userStore.createUser_store({...newUser.value,roles:[newUser.value.roles]}); toast.add({severity:'success',summary:'Успех',detail:'Пользователь создан!',life:3000}); resetForm(); emit('success'); emit('close') }
  catch(e) { toast.add({severity:'error',summary:'Ошибка',detail:e.response?.data?.message||'Ошибка создания',life:5000}) }
  finally { isSubmitting.value=false }
}
</script>

<style scoped>
.modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.4); display:flex; align-items:center; justify-content:center; z-index:10000; }
.modal-content { background:var(--color-canvas); border-radius:var(--rounded-lg); width:90%; max-width:480px; max-height:80vh; display:flex; flex-direction:column; box-shadow:0 20px 60px rgba(0,0,0,0.2); }
.modal-header { display:flex; justify-content:space-between; align-items:center; padding:20px 24px 0; }
.modal-header h3 { margin:0; font-size:18px; color:var(--color-ink); }
.modal-close { background:transparent; border:none; cursor:pointer; font-size:16px; color:var(--color-ink-muted-48); padding:4px; border-radius:4px; }
.modal-close:hover { background:var(--color-divider-soft); }
.modal-body { padding:12px 24px; overflow-y:auto; flex:1; }
.form-group { margin-bottom:14px; display:flex; flex-direction:column; }
.form-group label { font-size:12px; font-weight:600; color:var(--color-ink-muted-48); text-transform:uppercase; letter-spacing:0.04em; margin-bottom:4px; }
.form-group input,.form-group select { width:100%; padding:10px 14px; border:1px solid var(--color-hairline); border-radius:var(--rounded-sm); font-size:14px; box-sizing:border-box; transition:border-color 0.2s; font-family:inherit; background:var(--color-canvas); color:var(--color-ink); }
.form-group input:focus,.form-group select:focus { outline:none; border-color:var(--color-primary); box-shadow:0 0 0 3px rgba(0,102,204,0.1); }
.form-group.has-error input { border-color:#ff3b30; }
.form-group.has-error input:focus { box-shadow:0 0 0 3px rgba(255,59,48,0.12); }
.field-error { color:#ff3b30; font-size:12px; margin-top:4px; }
.modal-actions { display:flex; gap:10px; padding:16px 24px 20px; border-top:1px solid var(--color-divider-soft); }
.btn-primary { flex:1; padding:10px 20px; background:var(--color-primary); color:var(--color-on-primary); border:none; border-radius:var(--rounded-pill); font-weight:400; font-size:14px; cursor:pointer; transition:opacity 0.2s; font-family:var(--font-body); }
.btn-primary:hover { opacity:0.85; }
.btn-primary:disabled { opacity:0.5; cursor:not-allowed; }
.btn-secondary { flex:1; padding:10px 20px; background:transparent; color:var(--color-ink-muted-48); border:1px solid var(--color-hairline); border-radius:var(--rounded-pill); font-weight:400; font-size:14px; cursor:pointer; transition:opacity 0.2s; font-family:var(--font-body); }
.btn-secondary:hover { opacity:0.7; }
</style>
