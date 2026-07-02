import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import bookingService from '../services/bookingService';
import '../styles/BookingForm.css';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    gender: 'Male',
    dateOfBirth: '',
    age: '',
    phone: '',
    whatsappNumber: '',
    email: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    emergencyContactName: '',
    emergencyContactNumber: '',
    occupation: '',
    idProofType: 'Aadhar Card',
    idProofNumber: '',
    height: '',
    weight: '',
    bloodGroup: 'A+',
    medicalCondition: 'No',
    medicalDetails: '',
    preferredBatch: 'Morning',
    plan_type: 'Monthly', // Maps to Membership Plan
    amount: '1500',
    startDate: '',
    profilePhoto: '',
    idProofPhoto: '',
    declaration: ''
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    let { name, value } = e.target;

    if (name === 'idProofType') {
      setFormData({ ...formData, idProofType: value, idProofNumber: '' });
      return;
    }

    if (name === 'idProofNumber' && formData.idProofType === 'Aadhar Card') {
      value = value.replace(/\D/g, ''); // Allow only digits
      if (value.length > 12) {
        value = value.slice(0, 12);
      }
      value = value.replace(/(\d{4})(?=\d)/g, '$1 ');
    }

    if (name === 'phone' || name === 'whatsappNumber' || name === 'emergencyContactNumber') {
      value = value.replace(/\D/g, ''); // Allow only digits
      if (value.length > 0 && !/^[6-9]/.test(value)) {
        value = ''; // Reset if first digit is not 6, 7, 8, or 9
      }

      let newErrors = { ...errors };
      const currentValues = {
        phone: name === 'phone' ? value : formData.phone,
        whatsappNumber: name === 'whatsappNumber' ? value : formData.whatsappNumber,
        emergencyContactNumber: name === 'emergencyContactNumber' ? value : formData.emergencyContactNumber
      };

      const bookingsData = localStorage.getItem('gym_bookings');
      const bookings = bookingsData ? JSON.parse(bookingsData) : [];

      ['phone', 'whatsappNumber', 'emergencyContactNumber'].forEach(field => {
        const fieldVal = currentValues[field];
        if (fieldVal && fieldVal.length > 0 && fieldVal.length !== 10) {
          newErrors[field] = "please enter 10 digit mobile number";
        } else if (fieldVal && fieldVal.length === 10) {
          let isDuplicateField = false;
          if (field === 'phone') {
            isDuplicateField = currentValues.phone === currentValues.emergencyContactNumber && currentValues.emergencyContactNumber !== '';
          } else if (field === 'whatsappNumber') {
            isDuplicateField = currentValues.whatsappNumber === currentValues.emergencyContactNumber && currentValues.emergencyContactNumber !== '';
          } else if (field === 'emergencyContactNumber') {
            isDuplicateField = (currentValues.emergencyContactNumber === currentValues.phone && currentValues.phone !== '') || (currentValues.emergencyContactNumber === currentValues.whatsappNumber && currentValues.whatsappNumber !== '');
          }

          const isDuplicateDB = bookings.some(b => b.phone === fieldVal || b.whatsappNumber === fieldVal || b.emergencyContactNumber === fieldVal);

          if (isDuplicateField || isDuplicateDB) {
            newErrors[field] = "this is already used .please use another number";
          } else if (newErrors[field] === "this is already used .please use another number" || newErrors[field] === "please enter 10 digit mobile number") {
            delete newErrors[field];
          }
        } else if (newErrors[field] === "this is already used .please use another number" || newErrors[field] === "please enter 10 digit mobile number") {
          delete newErrors[field];
        }
      });

      setErrors(newErrors);
    }

    if (name === 'email') {
      value = value.toLowerCase().replace(/[^a-z0-9@.]/g, '');
      let newErrors = { ...errors };

      const bookingsData = localStorage.getItem('gym_bookings');
      const bookings = bookingsData ? JSON.parse(bookingsData) : [];
      const isDuplicateDB = bookings.some(b => b.email === value);

      if (value.length > 0 && !/^[a-z0-9]+@[a-z0-9]+\.[a-z]{2,}$/.test(value)) {
        newErrors[name] = "Email format is invalid (e.g., test123@gmail.com), special characters are not allowed.";
      } else if (value.length > 0 && isDuplicateDB) {
        newErrors[name] = "this email is already use .please use another email";
      } else {
        delete newErrors[name];
      }
      setErrors(newErrors);
    }

    if (name === 'pincode') {
      value = value.replace(/\D/g, ''); // Allow only digits
      if (value.length > 6) {
        value = value.slice(0, 6);
      }
    }

    if (name === 'age') {
      let newErrors = { ...errors };
      if (value && parseInt(value, 10) < 14) {
        newErrors.age = "below 14 age is not allowed";
      } else {
        delete newErrors.age;
      }
      setErrors(newErrors);
    }

    if (name === 'plan_type') {
      let newAmount = '1500';
      if (value === '3 Months') newAmount = '4500';
      else if (value === '6 Months') newAmount = '9000';
      else if (value === 'Yearly') newAmount = '18000';

      setFormData({ ...formData, [name]: value, amount: newAmount });
      return;
    }

    setFormData({ ...formData, [name]: value });
  };

  const handleFileUpload = (e, fieldName) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, [fieldName]: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const validate = () => {
    let tempErrors = {};
    const bookingsData = localStorage.getItem('gym_bookings');
    const bookings = bookingsData ? JSON.parse(bookingsData) : [];

    if (!formData.firstName) tempErrors.firstName = "First name is required";
    if (!formData.lastName) tempErrors.lastName = "Last name is required";
    if (!formData.email) tempErrors.email = "Email is required";
    else if (!/^[a-z0-9]+@[a-z0-9]+\.[a-z]{2,}$/.test(formData.email)) tempErrors.email = "Email format is invalid (e.g., test123@gmail.com), special characters are not allowed.";
    else if (bookings.some(b => b.email === formData.email)) tempErrors.email = "this email is already use .please use another email";

    const checkPhoneDuplicateDB = (val) => bookings.some(b => b.phone === val || b.whatsappNumber === val || b.emergencyContactNumber === val);

    if (!formData.phone) {
      tempErrors.phone = "Phone is required";
    } else if (formData.phone.length !== 10) {
      tempErrors.phone = "please enter 10 digit mobile number";
    } else if (!/^[6-9]\d{9}$/.test(formData.phone)) {
      tempErrors.phone = "starts with 6,7,8,9 only this numbers and enter 10 digit number only";
    } else if (formData.phone === formData.emergencyContactNumber || checkPhoneDuplicateDB(formData.phone)) {
      tempErrors.phone = "this is already used .please use another number";
    }

    if (!formData.whatsappNumber) {
      tempErrors.whatsappNumber = "WhatsApp number is required";
    } else if (formData.whatsappNumber.length !== 10) {
      tempErrors.whatsappNumber = "please enter 10 digit mobile number";
    } else if (!/^[6-9]\d{9}$/.test(formData.whatsappNumber)) {
      tempErrors.whatsappNumber = "starts with 6,7,8,9 only this numbers and enter 10 digit number only";
    } else if (formData.whatsappNumber === formData.emergencyContactNumber || checkPhoneDuplicateDB(formData.whatsappNumber)) {
      tempErrors.whatsappNumber = "this is already used .please use another number";
    }

    if (!formData.emergencyContactNumber) {
      tempErrors.emergencyContactNumber = "Emergency contact number is required";
    } else if (formData.emergencyContactNumber.length !== 10) {
      tempErrors.emergencyContactNumber = "please enter 10 digit mobile number";
    } else if (!/^[6-9]\d{9}$/.test(formData.emergencyContactNumber)) {
      tempErrors.emergencyContactNumber = "starts with 6,7,8,9 only this numbers and enter 10 digit number only";
    } else if (formData.emergencyContactNumber === formData.phone || formData.emergencyContactNumber === formData.whatsappNumber || checkPhoneDuplicateDB(formData.emergencyContactNumber)) {
      tempErrors.emergencyContactNumber = "this is already used .please use another number";
    }

    if (!formData.dateOfBirth) tempErrors.dateOfBirth = "Date of birth is required";

    if (!formData.age) {
      tempErrors.age = "Age is required";
    } else if (parseInt(formData.age, 10) < 14) {
      tempErrors.age = "below 14 age is not allowed";
    }

    if (!formData.address) tempErrors.address = "Address is required";

    if (!formData.pincode) {
      tempErrors.pincode = "Pincode is required";
    } else if (formData.pincode.length !== 6) {
      tempErrors.pincode = "Pincode must be exactly 6 digits";
    }

    if (!formData.startDate) tempErrors.startDate = "Start date is required";
    if (!formData.amount) tempErrors.amount = "Fee amount is required";
    if (formData.declaration !== 'True') tempErrors.declaration = "You must agree to the declaration";
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validate()) {
      try {
        // Map to existing fields expected by service/backend for compatibility, 
        // while also sending the new ones.
        const submissionData = {
          ...formData,
          full_name: `${formData.firstName} ${formData.lastName}`,
          gym_slot: formData.preferredBatch,
          medical_condition: formData.medicalCondition,
          medical_details: formData.medicalDetails,
          joining_date: formData.startDate,
          booking_date: formData.startDate
        };
        const response = await bookingService.createBooking(submissionData);
        navigate(`/terms?bookingId=${response.bookingId}`);
      } catch (error) {
        toast.error('Error creating booking. Please try again.');
        console.error(error);
      }
    } else {
      toast.error('Please fill all required fields correctly.');
    }
  };

  return (
    <div className="form-page-wrapper">
      <div className="container form-container">
        <h1 style={{ color: '#ff3333', textAlign: 'center', fontSize: '3rem' }}> GYM Registration Form </h1>
        <form onSubmit={handleSubmit}>

          <h3>Personal Details</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div className="form-group">
              <label>First Name *</label>
              <input type="text" name="firstName" onChange={handleChange} value={formData.firstName} />
              {errors.firstName && <span className="error">{errors.firstName}</span>}
            </div>
            <div className="form-group">
              <label>Last Name *</label>
              <input type="text" name="lastName" onChange={handleChange} value={formData.lastName} />
              {errors.lastName && <span className="error">{errors.lastName}</span>}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div className="form-group">
              <label>Date of Birth *</label>
              <input type="date" name="dateOfBirth" onChange={handleChange} value={formData.dateOfBirth} />
              {errors.dateOfBirth && <span className="error">{errors.dateOfBirth}</span>}
            </div>
            <div className="form-group">
              <label>Age *</label>
              <input type="number" name="age" onChange={handleChange} value={formData.age} />
              {errors.age && <span className="error">{errors.age}</span>}
            </div>
          </div>

          <div className="form-group">
            <label>Gender *</label>
            <div style={{ display: 'flex', gap: '15px' }}>
              <label><input type="radio" name="gender" value="Male" onChange={handleChange} checked={formData.gender === 'Male'} /> Male</label>
              <label><input type="radio" name="gender" value="Female" onChange={handleChange} checked={formData.gender === 'Female'} /> Female</label>
              <label><input type="radio" name="gender" value="Other" onChange={handleChange} checked={formData.gender === 'Other'} /> Other</label>
            </div>
          </div>

          <h3>Contact Information</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div className="form-group">
              <label>Phone Number *</label>
              <input type="tel" name="phone" maxLength="10" onChange={handleChange} value={formData.phone} />
              {errors.phone && <span className="error">{errors.phone}</span>}
            </div>
            <div className="form-group">
              <label>WhatsApp Number *</label>
              <input type="tel" name="whatsappNumber" maxLength="10" onChange={handleChange} value={formData.whatsappNumber} />
              {errors.whatsappNumber && <span className="error">{errors.whatsappNumber}</span>}
            </div>
          </div>

          <div className="form-group">
            <label>Email *</label>
            <input type="email" name="email" onChange={handleChange} value={formData.email} />
            {errors.email && <span className="error">{errors.email}</span>}
          </div>

          <div className="form-group">
            <label>Address *</label>
            <textarea name="address" onChange={handleChange} value={formData.address} rows="2" style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }}></textarea>
            {errors.address && <span className="error">{errors.address}</span>}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
            <div className="form-group">
              <label>City *</label>
              <input type="text" name="city" onChange={handleChange} value={formData.city} />
            </div>
            <div className="form-group">
              <label>State *</label>
              <input type="text" name="state" onChange={handleChange} value={formData.state} />
            </div>
            <div className="form-group">
              <label>Pincode *</label>
              <input type="text" name="pincode" maxLength="6" onChange={handleChange} value={formData.pincode} />
              {errors.pincode && <span className="error">{errors.pincode}</span>}
            </div>
          </div>

          <h3>Emergency Contact & Occupation</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div className="form-group">
              <label>Emergency Contact Name *</label>
              <input type="text" name="emergencyContactName" onChange={handleChange} value={formData.emergencyContactName} />
            </div>
            <div className="form-group">
              <label>Emergency Contact Number *</label>
              <input type="tel" name="emergencyContactNumber" maxLength="10" onChange={handleChange} value={formData.emergencyContactNumber} />
              {errors.emergencyContactNumber && <span className="error">{errors.emergencyContactNumber}</span>}
            </div>
          </div>
          <div className="form-group">
            <label>Occupation *</label>
            <input type="text" name="occupation" onChange={handleChange} value={formData.occupation} />
          </div>

          <h3>Identity Details & Uploads</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div className="form-group">
              <label>ID Proof Type *</label>
              <select name="idProofType" onChange={handleChange} value={formData.idProofType}>
                <option value="Aadhar Card">Aadhar Card</option>
                <option value="PAN Card">PAN Card</option>
                <option value="Driving License">Driving License</option>
                <option value="Passport">Passport</option>
              </select>
            </div>
            <div className="form-group">
              <label>ID Proof Number *</label>
              <input type="text" name="idProofNumber" onChange={handleChange} value={formData.idProofNumber} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div className="form-group">
              <label>Profile Photo Upload</label>
              <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'profilePhoto')} />
            </div>
            <div className="form-group">
              <label>ID Proof Upload</label>
              <input type="file" accept="image/*,application/pdf" onChange={(e) => handleFileUpload(e, 'idProofPhoto')} />
            </div>
          </div>

          <h3>Physical & Medical Details</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
            <div className="form-group">
              <label>Height (cm) *</label>
              <input type="number" name="height" onChange={handleChange} value={formData.height} />
            </div>
            <div className="form-group">
              <label>Weight (kg) *</label>
              <input type="number" name="weight" onChange={handleChange} value={formData.weight} />
            </div>
            <div className="form-group">
              <label>Blood Group *</label>
              <select name="bloodGroup" onChange={handleChange} value={formData.bloodGroup}>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Medical Conditions</label>
            <div style={{ display: 'flex', gap: '15px' }}>
              <label><input type="radio" name="medicalCondition" value="Yes" onChange={handleChange} checked={formData.medicalCondition === 'Yes'} /> Yes</label>
              <label><input type="radio" name="medicalCondition" value="No" onChange={handleChange} checked={formData.medicalCondition === 'No'} /> No</label>
            </div>
          </div>
          <div className="form-group" style={{ opacity: formData.medicalCondition === 'Yes' ? 1 : 0.4, transition: 'opacity 0.3s' }}>
            <label>If yes, please specify:</label>
            <input type="text" name="medicalDetails" onChange={handleChange} value={formData.medicalDetails} disabled={formData.medicalCondition !== 'Yes'} />
          </div>

          <h3>Membership Details</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
            <div className="form-group">
              <label>Preferred Batch</label>
              <select name="preferredBatch" onChange={handleChange} value={formData.preferredBatch}>
                <option value="Morning">Morning</option>
                <option value="Afternoon">Afternoon</option>
                <option value="Evening">Evening</option>
              </select>
            </div>
            <div className="form-group">
              <label>Membership Plan</label>
              <select name="plan_type" onChange={handleChange} value={formData.plan_type}>
                <option value="Monthly">Monthly</option>
                <option value="3 Months">3 Months</option>
                <option value="6 Months">6 Months</option>
                <option value="Yearly">Yearly</option>
              </select>
            </div>

            <div className="form-group">
              <label>Total Amount (Rs)</label>
              <input type="text" name="amount" value={formData.amount} readOnly style={{ cursor: 'not-allowed' }} className="amount-input" />
              {errors.amount && <span className="error">{errors.amount}</span>}
            </div>

            <div className="form-group">
              <label>Start Date *</label>
              <input type="date" name="startDate" onChange={handleChange} value={formData.startDate} />
              {errors.startDate && <span className="error">{errors.startDate}</span>}
            </div>
          </div>

          <h3>Declaration</h3>
          <div className="form-group">
            <label style={{ fontSize: '1rem', fontWeight: 'normal', marginBottom: '15px', lineHeight: '1.5' }}>
              I confirm that the above information is true. I agree to follow all gym rules and understand that I exercise at my own risk.
            </label>
            <div style={{ display: 'flex', gap: '15px' }}>
              <label><input type="radio" name="declaration" value="True" onChange={handleChange} checked={formData.declaration === 'True'} /> True</label>
              <label><input type="radio" name="declaration" value="False" onChange={handleChange} checked={formData.declaration === 'False'} /> False</label>
            </div>
            {errors.declaration && <span className="error">{errors.declaration}</span>}
          </div>

          <button type="submit" className="btn">Submit Booking</button>
        </form>
      </div>
    </div>
  );
};

export default Register;
