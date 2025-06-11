import React, { useState, useCallback } from 'react';
import { Modal, Form, Input, Button } from 'antd';
import { LockOutlined } from '@ant-design/icons';
import { useUser } from '@/contexts/useAuth/userContext';
import { changePassMe } from '@/services/userServices';
import { useMessage } from '@/hooks/useMessage';
import { ChangePasswordPayload } from '@services/types/types';

interface ChangePasswordModalProps {
    open: boolean;
    onClose: () => void;
}

const ChangePasswordModal = ({ open, onClose }: ChangePasswordModalProps) => {
    const { user } = useUser();
    const { message, contextHolder } = useMessage();
    const [loading, setLoading] = useState(false);
    const [form] = Form.useForm();

    const handleSubmit = useCallback(
        async (values: ChangePasswordPayload) => {
            if (!user?.id) return;

            const key = 'change-password-loading';
            setLoading(true);
            message.loading({ key, content: 'Đang thay đổi mật khẩu...' });

            try {
                await changePassMe(values);
                message.success({ key, content: 'Đổi mật khẩu thành công!' });
                form.resetFields();
                onClose();
            } catch (error: any) {
                const errorMsg = error?.response?.data?.message || error?.message || 'Không thể đổi mật khẩu';
                message.error({ key, content: errorMsg });
            } finally {
                setLoading(false);
            }
        },
        [user, message, form, onClose],
    );

    return (
        <>
            {contextHolder}
            <Modal open={open} onCancel={onClose} title="Đổi mật khẩu" footer={null} centered destroyOnClose>
                <Form form={form} layout="vertical" onFinish={handleSubmit} className="space-y-4 pt-2">
                    <Form.Item
                        name="currentPassword"
                        label="Mật khẩu hiện tại"
                        rules={[{ required: true, message: 'Vui lòng nhập mật khẩu hiện tại!' }]}
                    >
                        <Input.Password
                            prefix={<LockOutlined />}
                            placeholder="Nhập mật khẩu hiện tại"
                            onKeyDown={(e) => {
                                if (e.key === ' ' && !e.currentTarget.value) {
                                    e.preventDefault();
                                }
                            }}
                        />
                    </Form.Item>

                    <Form.Item
                        name="newPassword"
                        label="Mật khẩu mới"
                        rules={[
                            { required: true, message: 'Vui lòng nhập mật khẩu mới!' },
                            { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự!' },
                        ]}
                    >
                        <Input.Password
                            prefix={<LockOutlined />}
                            placeholder="Nhập mật khẩu mới"
                            onKeyDown={(e) => {
                                if (e.key === ' ' && !e.currentTarget.value) {
                                    e.preventDefault();
                                }
                            }}
                        />
                    </Form.Item>

                    <Form.Item
                        name="confirmPassword"
                        label="Xác nhận mật khẩu mới"
                        dependencies={['newPassword']}
                        rules={[
                            { required: true, message: 'Vui lòng xác nhận mật khẩu mới!' },
                            ({ getFieldValue }) => ({
                                validator(_, value) {
                                    if (!value || getFieldValue('newPassword') === value) {
                                        return Promise.resolve();
                                    }
                                    return Promise.reject(new Error('Mật khẩu xác nhận không khớp!'));
                                },
                            }),
                        ]}
                    >
                        <Input.Password
                            prefix={<LockOutlined />}
                            placeholder="Nhập lại mật khẩu mới"
                            onKeyDown={(e) => {
                                if (e.key === ' ' && !e.currentTarget.value) {
                                    e.preventDefault();
                                }
                            }}
                        />
                    </Form.Item>

                    <Form.Item>
                        <Button type="primary" htmlType="submit" loading={loading} className="w-full">
                            Đổi mật khẩu
                        </Button>
                    </Form.Item>
                </Form>
            </Modal>
        </>
    );
};

export default ChangePasswordModal;
