import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// Async thunks for OD
export const applyOD = createAsyncThunk('iot/applyOD', async (formData, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/od/apply', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to apply OD');
  }
});

export const getStudentODs = createAsyncThunk('iot/getStudentODs', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/od/student');
    return data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch ODs');
  }
});

export const getMentorPendingODs = createAsyncThunk('iot/getMentorPendingODs', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/od/mentor/pending');
    return data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch pending ODs');
  }
});

export const processOD = createAsyncThunk('iot/processOD', async ({ id, status, mentorRemark }, { rejectWithValue }) => {
  try {
    const { data } = await api.put(`/od/mentor/approve/${id}`, { status, mentorRemark });
    return data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to process OD');
  }
});

// Student IoT Attendance
export const getStudentIotAttendance = createAsyncThunk('iot/getStudentIotAttendance', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/student/iot-attendance');
    return data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch IoT attendance');
  }
});

const iotSlice = createSlice({
  name: 'iot',
  initialState: {
    studentODs: [],
    mentorPendingODs: [],
    studentIotAttendance: [],
    loading: false,
    error: null,
    applyLoading: false,
  },
  reducers: {
    clearError: (state) => { state.error = null; },
  },
  extraReducers: (builder) => {
    builder
      // Apply OD
      .addCase(applyOD.pending, (state) => { state.applyLoading = true; state.error = null; })
      .addCase(applyOD.fulfilled, (state, action) => {
        state.applyLoading = false;
        state.studentODs.unshift(action.payload);
      })
      .addCase(applyOD.rejected, (state, action) => {
        state.applyLoading = false;
        state.error = action.payload;
      })
      // Get Student ODs
      .addCase(getStudentODs.pending, (state) => { state.loading = true; })
      .addCase(getStudentODs.fulfilled, (state, action) => {
        state.loading = false;
        state.studentODs = action.payload;
      })
      .addCase(getStudentODs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Get Mentor Pending ODs
      .addCase(getMentorPendingODs.pending, (state) => { state.loading = true; })
      .addCase(getMentorPendingODs.fulfilled, (state, action) => {
        state.loading = false;
        state.mentorPendingODs = action.payload;
      })
      .addCase(getMentorPendingODs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Process OD
      .addCase(processOD.fulfilled, (state, action) => {
        state.mentorPendingODs = state.mentorPendingODs.filter(od => od._id !== action.payload._id);
      })
      // Get Student IoT Attendance
      .addCase(getStudentIotAttendance.pending, (state) => { state.loading = true; })
      .addCase(getStudentIotAttendance.fulfilled, (state, action) => {
        state.loading = false;
        state.studentIotAttendance = action.payload;
      })
      .addCase(getStudentIotAttendance.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError } = iotSlice.actions;
export default iotSlice.reducer;
