// ProfilePage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { Card, Form, Input, Button, Avatar, Typography, Divider, DatePicker, Upload, Select } from 'antd';
import { UserOutlined, MailOutlined, PhoneOutlined, HomeOutlined, CameraOutlined } from '@ant-design/icons';
import { useUser } from '@/contexts/useAuth/userContext';
import { getMeProfile, updateMeProfile } from '@/services/userServices';
import { useMessage } from '@/hooks/useMessage';
import dayjs from 'dayjs';
import { UpdateUserProfile } from '@services/types/types';

const { Title } = Typography;
const { Option } = Select;

const ProfilePage: React.FC = () => {
    const { user } = useUser();
    const { message, contextHolder } = useMessage();
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [avatarFile, setAvatarFile] = useState<any>(null);
    const [avatarUrl, setAvatarUrl] = useState<string>('');

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await getMeProfile();
                if (res) {
                    if (res.avatar_url) {
                        setAvatarUrl(res.avatar_url);
                    }
                    form.setFieldsValue({
                        full_name: res.full_name,
                        email: res.email,
                        phone_number: res.phone_number || '',
                        gender: res.gender || 'other',
                        address: res.address || '',
                        bio: res.bio || '',
                        date_of_birth: res.date_of_birth ? dayjs(res.date_of_birth) : null,
                    });
                }
            } catch (error) {
                message.error({ key: 'fetch-profile-error', content: 'Failed to fetch profile' });
            }
        };

        fetchProfile();
    }, [form, message]);

    const handleFileChange = useCallback((info: any) => {
        const file = info.file.originFileObj;
        if (file) {
            setAvatarFile(file);
            setAvatarUrl(URL.createObjectURL(file));
        }
    }, []);

    const handleProfileUpdate = useCallback(
        async (values: Partial<UpdateUserProfile>) => {
            if (!user?.id) {
                message.error({ key: 'update-error', content: 'User not found' });
                return;
            }

            const loadingKey = 'update-profile-loading';
            setLoading(true);
            message.loading({ key: loadingKey, content: 'Updating profile...' });

            try {
                const payload: Partial<UpdateUserProfile> = {
                    full_name: values.full_name?.trim(),
                    phone_number: values.phone_number?.trim(),
                    gender: values.gender,
                    address: values.address?.trim(),
                    bio: values.bio?.trim(),
                };

                if (values.date_of_birth) {
                    const date = values.date_of_birth as any;
                    payload.date_of_birth = date?.format?.('YYYY-MM-DD') || null;
                }

                payload.avatar = avatarFile instanceof File ? avatarFile : user.avatar_url;

                const res = await updateMeProfile(payload);
                if (!res) return;

                if (res.avatar_url) {
                    setAvatarUrl(res.avatar_url);
                    setAvatarFile(null);
                }

                form.setFieldsValue({
                    full_name: res.full_name,
                    email: res.email,
                    phone_number: res.phone_number || '',
                    gender: res.gender || 'other',
                    address: res.address || '',
                    bio: res.bio || '',
                    date_of_birth: res.date_of_birth ? dayjs(res.date_of_birth) : null,
                });

                message.success({ key: loadingKey, content: 'Profile updated successfully!' });
            } catch (error) {
                console.error('Update error:', error);
                message.error({ key: loadingKey, content: 'Failed to update profile' });
            } finally {
                setLoading(false);
            }
        },
        [user, avatarFile, form, message]
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
            {contextHolder}
            <div className="mx-auto">
                <Card className="shadow-xl border-0 bg-white">
                    <div className="text-center mb-8">
                        <div className="relative w-32 h-32 mx-auto mb-4">
                            <Avatar
                                size={120}
                                src={avatarUrl}
                                icon={<UserOutlined />}
                                className="w-full h-full rounded-full object-cover border-4 border-white shadow-lg"
                            />
                            <Upload
                                customRequest={({ onSuccess }) => setTimeout(() => onSuccess?.('ok'), 0)}
                                onChange={handleFileChange}
                                showUploadList={false}
                                accept="image/*"
                            >
                                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 hover:opacity-100 transition-opacity duration-200 cursor-pointer">
                                    <CameraOutlined className="text-white text-2xl" />
                                </div>
                            </Upload>
                        </div>
                        <Title level={4} className="mt-3 text-gray-800 font-semibold">
                            {user?.full_name || 'No name provided'}
                        </Title>
                    </div>

                    <Divider>Profile Information</Divider>

                    <Form form={form} layout="vertical" onFinish={handleProfileUpdate} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Form.Item name="full_name" label="Full Name" rules={[{ required: true }]}>
                                <Input prefix={<UserOutlined />} placeholder="Enter full name" />
                            </Form.Item>
                            <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
                                <Input prefix={<MailOutlined />} disabled />
                            </Form.Item>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Form.Item name="phone_number" label="Phone Number" rules={[{ required: true }]}>
                                <Input prefix={<PhoneOutlined />} placeholder="Enter phone number" />
                            </Form.Item>
                            <Form.Item name="gender" label="Gender" rules={[{ required: true }]}>
                                <Select>
                                    <Option value="male">Male</Option>
                                    <Option value="female">Female</Option>
                                    <Option value="other">Other</Option>
                                </Select>
                            </Form.Item>
                        </div>
                        <Form.Item name="address" label="Address">
                            <Input prefix={<HomeOutlined />} placeholder="Enter address" />
                        </Form.Item>
                        <Form.Item name="date_of_birth" label="Date of Birth">
                            <DatePicker className="w-full" placeholder="Select date of birth" format="DD/MM/YYYY" />
                        </Form.Item>
                        <Form.Item name="bio" label="Bio">
                            <Input.TextArea rows={4} placeholder="Enter your bio" />
                        </Form.Item>
                        <Form.Item>
                            <Button type="primary" htmlType="submit" loading={loading} className="w-full">
                                Update Profile
                            </Button>
                        </Form.Item>
                    </Form>
                </Card>
            </div>
        </div>
    );
};

export default ProfilePage;

