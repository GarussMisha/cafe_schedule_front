<template>
  <div v-if="isOpen" class="modal-overlay" @click.self="closeModal">
    <div class="modal-content">
      <div class="modal-header">
        <h3>Редактировать кафе</h3>
        <button @click="closeModal" class="modal-close-btn" type="button">
          <i class="pi pi-times"></i>
        </button>
      </div>

      <div v-if="cafe" class="modal-body">
        <div class="edit-label">
          {{ cafe.name }}
        </div>

        <div class="form-group">
          <label for="editCafeName">Название кафе</label>
          <input id="editCafeName" v-model="editCafeData.name" />
        </div>

        <div class="form-group">
          <label for="editCafeAddress">Адрес</label>
          <input id="editCafeAddress" type="text" v-model="editCafeData.address" />
        </div>

        <div class="form-group">
          <label for="editCafePhone">Телефон</label>
          <input id="editCafePhone" type="text" v-model="editCafeData.phone" />
        </div>
      </div>

      <div class="modal-actions">
        <button @click="updateCafe" class="btn-primary" type="button" :disabled="isSubmitting">
          {{ isSubmitting ? 'Обновление...' : 'Обновить кафе' }}
        </button>
        <button @click="closeModal" class="btn-secondary" type="button">
          Закрыть
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { updateCafe as apiUpdateCafe } from '@/api/cafe';
import { useToast } from 'primevue/usetoast'

const toast = useToast()
const emit = defineEmits(['close', 'success']);

const props = defineProps({
  isOpen: Boolean,
  cafe: Object
});

const isSubmitting = ref(false)
const editCafeData = ref({
  name: '',
  address: '',
  phone: ''
});

const internalVisible = ref(false);

watch(() => props.isOpen, (val) => {
  internalVisible.value = val;
});

watch(internalVisible, (val) => {
  if (!val) {
    emit('close');
  }
});

watch(() => props.cafe, (newCafe) => {
  if (newCafe) {
    editCafeData.value = {
      name: newCafe.name || '',
      address: newCafe.address || '',
      phone: newCafe.phone || ''
    }
  }
}, { immediate: true });

function closeModal() {
  internalVisible.value = false;
  emit('close');
}

async function updateCafe() {
  if (isSubmitting.value) return
  if (!props.cafe) {
    toast.add({ severity: 'warn', summary: 'Внимание', detail: 'Кафе не выбрано', life: 3000 })
    return
  }
  if (!editCafeData.value.name.trim()) {
    toast.add({ severity: 'warn', summary: 'Внимание', detail: 'Введите название кафе!', life: 3000 })
    return
  }

  isSubmitting.value = true
  try {
    await apiUpdateCafe(props.cafe.id, editCafeData.value)
    toast.add({ severity: 'success', summary: 'Успех', detail: 'Кафе обновлено!', life: 3000 })
    emit('success')
    emit('close')
  } catch (error) {
    console.error('Ошибка обновления кафе:', error)
    toast.add({ severity: 'error', summary: 'Ошибка', detail: error.response?.data?.message || error.response?.data || 'Ошибка обновления кафе', life: 5000 })
  } finally {
    isSubmitting.value = false
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
}

.modal-content {
  background: white;
  border-radius: 16px;
  width: 90%;
  max-width: 520px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px 0;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  color: #1a1a1a;
}

.modal-close-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 18px;
  color: #999;
  padding: 4px;
  border-radius: 4px;
}

.modal-close-btn:hover {
  background: rgba(0, 0, 0, 0.05);
  color: #333;
}

.modal-body {
  padding: 12px 24px;
  overflow-y: auto;
  flex: 1;
}

.edit-label {
  font-size: 14px;
  font-weight: 600;
  color: #ff9800;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.form-group {
  margin-bottom: 16px;
  display: flex;
  flex-direction: column;
}

.form-group label {
  font-size: 13px;
  font-weight: 700;
  color: #888;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 6px;
}

.form-group input {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid #ddd;
  border-radius: 10px;
  font-size: 14px;
  box-sizing: border-box;
  transition: border-color 0.2s;
  font-family: inherit;
}

.form-group input:focus {
  outline: none;
  border-color: #ff9800;
  box-shadow: 0 0 0 2px rgba(255, 152, 0, 0.1);
}

.modal-actions {
  display: flex;
  gap: 12px;
  padding: 16px 24px 20px;
  border-top: 1px solid #f0f0f0;
}

.btn-primary {
  flex: 1;
  padding: 10px 20px;
  background: #ff9800;
  color: white;
  border: none;
  border-radius: 10px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary:hover {
  background: #e68900;
}

.btn-primary:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.btn-secondary {
  flex: 1;
  padding: 10px 20px;
  background: transparent;
  color: #999;
  border: 1px solid #ddd;
  border-radius: 10px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary:hover {
  background: rgba(0, 0, 0, 0.03);
  color: #666;
  border-color: #ccc;
}
</style>
