// ChangePasswordPage.tsx
import React, { useState, useCallback } from 'react';
import { Card, Form, Input, Button, Divider } from 'antd';
import { LockOutlined } from '@ant-design/icons';
import { useUser } from '@/contexts/useAuth/userContext';
import { changePassMe } from '@/services/userServices';
import { useMessage } from '@/hooks/useMessage';
import { ChangePasswordPayload } from '@services/types/types';

const ChangePasswordPage: React.FC = () => {
    const { user } = useUser();
    const { message } = useMessage();
    const [loading, setLoading] = useState(false);
    const [passwordForm] = Form.useForm();

    const handlePasswordChange = useCallback(
        async (values: ChangePasswordPayload) => {
            if (!user?.id) return;

            const loadingKey = 'change-password-loading';
            setLoading(true);
            message.loading({ key: loadingKey, content: 'Changing password...' });

            try {
                await changePassMe(values);
                message.success({ key: loadingKey, content: 'Password changed successfully!' });
                passwordForm.resetFields();
            } catch (error) {
                message.error({ key: loadingKey, content: 'Failed to change password' });
            } finally {
                setLoading(false);
            }
        },
        [user, passwordForm, message]
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
           // ChangePasswordPage.tsx (tiếp theo)
            <div className="mx-auto">
                <Card className="shadow-xl border-0 bg-white">
                    <div className="text-center mb-8">
                        <h3 className="text-gray-800 font-semibold text-lg">Change Password</h3>
                    </div>

                    <Divider>Change Your Password</Divider>

                    <Form form={passwordForm} layout="vertical" onFinish={handlePasswordChange}>
                        <Form.Item
                            name="currentPassword"
                            label="Current Password"
                            rules={[{ required: true, message: 'Please enter your current password!' }]}
                        >
                            <Input.Password prefix={<LockOutlined />} placeholder="Enter current password" />
                        </Form.Item>

                        <Form.Item
                            name="newPassword"
                            label="New Password"
                            rules={[
                                { required: true, message: 'Please enter your new password!' },
                                { min: 6, message: 'Password must be at least 6 characters long!' },
                            ]}
                        >
                            <Input.Password prefix={<LockOutlined />} placeholder="Enter new password" />
                        </Form.Item>

                        <Form.Item
                            name="confirmPassword"
                            label="Confirm New Password"
                            dependencies={['newPassword']}
                            rules={[
                                { required: true, message: 'Please confirm your new password!' },
                                ({ getFieldValue }) => ({
                                    validator(_, value) {
                                        if (!value || getFieldValue('newPassword') === value) {
                                            return Promise.resolve();
                                        }
                                        return Promise.reject(new Error('Passwords do not match!'));
                                    },
                                }),
                            ]}
                        >
                            <Input.Password prefix={<LockOutlined />} placeholder="Confirm new password" />
                        </Form.Item>

                        <Form.Item>
                            <Button type="primary" htmlType="submit" loading={loading} className="w-full">
                                Change Password
                            </Button>
                        </Form.Item>
                    </Form>
                </Card>
            </div>
        </div>
    );
};

export default ChangePasswordPage;

