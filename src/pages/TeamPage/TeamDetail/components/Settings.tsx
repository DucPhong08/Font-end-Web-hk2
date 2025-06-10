import React, { useState, useEffect, useRef } from 'react';
import { Form, Input, Button, Card, Upload, Modal, Row, Col, Typography, Spin } from 'antd';
import type { DraggableData, DraggableEvent } from 'react-draggable';
import Draggable from 'react-draggable';
import {
    DeleteOutlined,
    UserOutlined,
    MailOutlined,
    ClockCircleOutlined,
    EditOutlined,
    LoadingOutlined,
    PlusOutlined,
    LogoutOutlined,
    CameraOutlined,
} from '@ant-design/icons';
import type { UploadProps } from 'antd';
import { useMessage } from '@/hooks/useMessage';
import { useNavigate, useLocation } from 'react-router-dom';
import getTeamById from '@/services/teamServices/getTeamById';
import { Team } from '@services/types/types';
import { deleteTeam, updateTeam } from '@services/teamServices';
import leaveTeam from '@/services/teamServices/leaveTeam';
import { useUser } from '@/contexts/useAuth/userContext';
import type { UpdateTeamPayload } from '@/services/types/types';

const { Title, Text } = Typography;

interface SettingsProps {
    teamId: string | undefined;
}

const getBase64 = (img: File, callback: (url: string) => void) => {
    const reader = new FileReader();
    reader.addEventListener('load', () => callback(reader.result as string));
    reader.readAsDataURL(img);
};

const Settings = ({ teamId }: SettingsProps) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [fetchingTeam, setFetchingTeam] = useState(true);
    const [teamData, setTeamData] = useState<Team | undefined>(undefined);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const { message, contextHolder } = useMessage();
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useUser();
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarUrl, setAvatarUrl] = useState<string>('');
    const [isEditing, setIsEditing] = useState(false);
    const [uploadLoading, setUploadLoading] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [disabled, setDisabled] = useState(true);
    const [bounds, setBounds] = useState({ left: 0, top: 0, bottom: 0, right: 0 });
    const draggleRef = useRef<HTMLDivElement>(null);

    const isJoinedTeam = location.pathname.includes('/teams/joined');

    useEffect(() => {
        const fetchData = async () => {
            if (!teamId) {
                setFetchingTeam(false);
                return;
            }
            setFetchingTeam(true);
            setFetchError(null);
            try {
                const data = await getTeamById(teamId);
                setTeamData(data);
                form.setFieldsValue({
                    name: data.name,
                    description: data.description,
                });
                setAvatarUrl(data.avatar_url || '');
            } catch (error: any) {
                console.error('Error fetching team data:', error);
                setFetchError(error.message || 'Không thể tải thông tin nhóm.');
                message.error({
                    key: 'fetch-error',
                    content: error.message || 'Không thể tải thông tin nhóm.',
                });
            } finally {
                setFetchingTeam(false);
            }
        };
        fetchData();
    }, [teamId, form, message]);

    const beforeUpload = (file: File) => {
        const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
        if (!isJpgOrPng) {
            message.error({
                key: 'upload-type-error',
                content: 'Chỉ có thể tải lên file JPG/PNG!',
            });
            return Upload.LIST_IGNORE;
        }
        const isLt3M = file.size / 1024 / 1024 < 3;
        if (!isLt3M) {
            message.error({
                key: 'upload-size-error',
                content: 'Ảnh phải nhỏ hơn 3MB!',
            });
            return Upload.LIST_IGNORE;
        }
        return true;
    };

    const handleFileChange: UploadProps['onChange'] = (info) => {
        const file = info.file.originFileObj;
        if (file) {
            setAvatarFile(file);
            setAvatarUrl(URL.createObjectURL(file));
        }
    };

    const uploadButton = (
        <div className="flex flex-col items-center justify-center h-full">
            {uploadLoading ? <LoadingOutlined /> : <PlusOutlined />}
            <div className="mt-2">Tải ảnh lên</div>
        </div>
    );

    const handleSubmit = async (values: any) => {
        if (!teamId || !teamData) {
            message.error({
                key: 'submit-error',
                content: 'Không tìm thấy thông tin nhóm!',
            });
            return;
        }

        setLoading(true);
        const loadingKey = 'update-team-loading';
        message.loading({
            key: loadingKey,
            content: 'Đang cập nhật thông tin nhóm...',
        });

        try {
            const payload: UpdateTeamPayload = {
                name: values.name.trim(),
                description: values.description.trim(),
                avatar: avatarFile || null,
            };

            await updateTeam(Number(teamId), payload);

            // Fetch lại dữ liệu team để đảm bảo có thông tin mới nhất
            const updatedTeamData = await getTeamById(teamId);
            setTeamData(updatedTeamData);

            // Cập nhật form với dữ liệu mới
            form.setFieldsValue({
                name: updatedTeamData.name,
                description: updatedTeamData.description,
            });

            // Cập nhật avatar URL
            setAvatarUrl(updatedTeamData.avatar_url || '');

            setAvatarFile(null);
            message.success({
                key: loadingKey,
                content: 'Cập nhật thông tin nhóm thành công!',
            });
            setIsEditing(false);
        } catch (error: any) {
            console.error('Update error:', error);
            message.error({
                key: loadingKey,
                content: error.message || 'Có lỗi xảy ra khi cập nhật thông tin nhóm!',
            });
        } finally {
            setLoading(false);
        }
    };

    const onStart = (_event: DraggableEvent, uiData: DraggableData) => {
        const { clientWidth, clientHeight } = window.document.documentElement;
        const targetRect = draggleRef.current?.getBoundingClientRect();
        if (!targetRect) {
            return;
        }
        setBounds({
            left: -targetRect.left + uiData.x,
            right: clientWidth - (targetRect.right - uiData.x),
            top: -targetRect.top + uiData.y,
            bottom: clientHeight - (targetRect.bottom - uiData.y),
        });
    };

    const handleDeleteOrLeaveTeam = () => {
        if (!teamId) return;
        setDeleteModalOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!teamId || !user) return;

        setDeleteLoading(true);
        try {
            if (isJoinedTeam) {
                // Leave team
                await leaveTeam(Number(teamId));
                message.success({
                    key: 'leave-team-success',
                    content: 'Đã rời khỏi nhóm thành công!',
                });
            } else {
                // Delete team
                await deleteTeam(Number(teamId));
                message.success({
                    key: 'delete-team-success',
                    content: 'Đã xóa nhóm thành công!',
                });
            }

            setDeleteModalOpen(false);

            if (teamData?.creator_id === user?.id) {
                navigate('/teams/created');
            } else {
                navigate('/teams/joined');
            }
        } catch (error: any) {
            console.error('Error deleting/leaving team:', error);
            message.error({
                key: 'delete-leave-error',
                content: isJoinedTeam
                    ? error.message || 'Có lỗi xảy ra khi rời nhóm!'
                    : error.message || 'Có lỗi xảy ra khi xóa nhóm!',
            });
        } finally {
            setDeleteLoading(false);
        }
    };

    const handleDeleteCancel = () => {
        setDeleteModalOpen(false);
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        setAvatarFile(null);
        // Reset form về giá trị ban đầu
        form.setFieldsValue({
            name: teamData?.name,
            description: teamData?.description,
        });
        // Reset avatar URL về giá trị ban đầu
        setAvatarUrl(teamData?.avatar_url || '');
    };

    if (fetchingTeam) {
        return (
            <div className="flex justify-center items-center h-screen">
                <Spin size="large" tip="Đang tải thông tin nhóm..." />
            </div>
        );
    }

    if (fetchError || !teamId || !teamData) {
        return (
            <div className="text-center text-red-500 mt-8">
                <p>{fetchError || 'Không thể tải thông tin nhóm.'}</p>
            </div>
        );
    }

    return (
        <div className="container py-8">
            <style>{`
                .avatar-uploader .ant-upload {
                    width: 192px !important;
                    height: 192px !important;
                }
                .avatar-uploader .ant-upload-select {
                    width: 192px !important;
                    height: 192px !important;
                    border-radius: 50% !important;
                    position: relative;
                    overflow: hidden;
                }
                .avatar-uploader .ant-upload-select:hover .avatar-overlay {
                    opacity: 1;
                }
                .avatar-overlay {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background-color: rgba(0, 0, 0, 0.5);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    opacity: 0;
                    transition: opacity 0.3s ease;
                    border-radius: 50%;
                    z-index: 1;
                }
                .avatar-overlay .anticon {
                    color: white;
                    font-size: 24px;
                }
            `}</style>
            {contextHolder}
            <Card title="Thông tin cơ bản" className="shadow-lg rounded-lg mb-6">
                <Row gutter={[24, 24]} align="top">
                    <Col xs={24} md={8} className="flex justify-center items-center">
                        <div className="relative w-48 h-48 mb-4">
                            {isEditing && !isJoinedTeam ? (
                                <Upload
                                    name="avatar"
                                    listType="picture-circle"
                                    className="avatar-uploader w-full h-full"
                                    showUploadList={false}
                                    customRequest={({ onSuccess }) => setTimeout(() => onSuccess?.('ok'), 0)}
                                    beforeUpload={beforeUpload}
                                    onChange={handleFileChange}
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                    }}
                                >
                                    <div className="w-48 h-48 flex items-center justify-center relative">
                                        {avatarUrl ? (
                                            <>
                                                <img
                                                    src={avatarUrl}
                                                    alt="Team Avatar"
                                                    className="w-full h-full rounded-full object-cover"
                                                />
                                                <div className="avatar-overlay">
                                                    <CameraOutlined />
                                                </div>
                                            </>
                                        ) : (
                                            uploadButton
                                        )}
                                    </div>
                                </Upload>
                            ) : (
                                <img
                                    src={
                                        avatarUrl ||
                                        'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQZv99BmQS7BQU0o7kNhRFwjSD2lyl48qFOlw&s'
                                    }
                                    alt="Team Avatar"
                                    className="w-full h-full rounded-full object-cover border-4 border-white shadow-lg"
                                />
                            )}
                        </div>
                    </Col>
                    <Col xs={24} md={16}>
                        {isEditing && !isJoinedTeam ? (
                            <Form
                                form={form}
                                layout="vertical"
                                onFinish={handleSubmit}
                                initialValues={{
                                    name: teamData.name,
                                    description: teamData.description,
                                }}
                            >
                                <Form.Item
                                    name="name"
                                    label="Tên nhóm"
                                    rules={[
                                        { required: true, message: 'Vui lòng nhập tên nhóm' },
                                        { min: 3, message: 'Tên nhóm phải có ít nhất 3 ký tự' },
                                    ]}
                                >
                                    <Input placeholder="Nhập tên nhóm" />
                                </Form.Item>

                                <Form.Item
                                    name="description"
                                    label="Mô tả"
                                    rules={[
                                        { required: true, message: 'Vui lòng nhập mô tả' },
                                        { min: 10, message: 'Mô tả phải có ít nhất 10 ký tự' },
                                    ]}
                                >
                                    <Input.TextArea
                                        rows={4}
                                        placeholder="Nhập mô tả về nhóm của bạn"
                                        maxLength={500}
                                        showCount
                                    />
                                </Form.Item>

                                <Form.Item>
                                    <div className="flex gap-2">
                                        <Button type="primary" htmlType="submit" loading={loading}>
                                            Lưu thay đổi
                                        </Button>
                                        <Button onClick={handleCancelEdit}>Hủy</Button>
                                    </div>
                                </Form.Item>
                            </Form>
                        ) : (
                            <div className="space-y-4">
                                <div className="flex justify-between items-start">
                                    <div className="flex-grow pr-4">
                                        <div className="mb-3">
                                            <div className="font-semibold text-gray-700">Tên nhóm:</div>
                                            <div>{teamData.name || 'N/A'}</div>
                                        </div>
                                        <div>
                                            <div className="font-semibold text-gray-700">Mô tả:</div>
                                            <div>{teamData.description || 'N/A'}</div>
                                        </div>
                                    </div>
                                    {!isJoinedTeam && (
                                        <Button type="text" icon={<EditOutlined />} onClick={() => setIsEditing(true)}>
                                            Chỉnh sửa
                                        </Button>
                                    )}
                                </div>

                                <div className="bg-gray-100 p-4 rounded-lg">
                                    <Title level={5} className="mt-0 mb-4 text-gray-700">
                                        Thông tin người tạo
                                    </Title>
                                    <div className="space-y-3 text-gray-600">
                                        <div className="flex items-center">
                                            <UserOutlined className="text-gray-500 mr-2" />
                                            <Text>{teamData.creator_name || 'N/A'}</Text>
                                        </div>
                                        <div className="flex items-center">
                                            <MailOutlined className="text-gray-500 mr-2" />
                                            <Text>{teamData.creator_email || 'N/A'}</Text>
                                        </div>
                                        <div className="flex items-center">
                                            <ClockCircleOutlined className="text-gray-500 mr-2" />
                                            <Text>
                                                {teamData.created_at
                                                    ? new Date(teamData.created_at).toLocaleDateString('vi-VN')
                                                    : 'N/A'}
                                            </Text>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </Col>
                </Row>
            </Card>

            <Card title="Cài đặt nâng cao" className="shadow-lg rounded-lg bg-red-50 border border-red-200">
                <div className="space-y-4">
                    <div>
                        <h3 className="text-lg font-semibold text-red-700 mb-2">Vùng nguy hiểm</h3>
                        <p className="text-red-600 mb-4">
                            {isJoinedTeam
                                ? 'Rời khỏi nhóm sẽ không thể khôi phục lại quyền truy cập. Vui lòng cẩn thận khi thực hiện.'
                                : 'Các hành động trong khu vực này có thể ảnh hưởng nghiêm trọng đến nhóm của bạn. Vui lòng cẩn thận khi thực hiện.'}
                        </p>
                    </div>

                    <Button
                        danger
                        icon={isJoinedTeam ? <LogoutOutlined /> : <DeleteOutlined />}
                        onClick={handleDeleteOrLeaveTeam}
                        className="hover:!bg-red-600 transition-colors duration-200"
                    >
                        {isJoinedTeam ? 'Rời nhóm' : 'Xóa nhóm'}
                    </Button>
                </div>
            </Card>

            <Modal
                title={
                    <div
                        style={{ width: '100%', cursor: 'move' }}
                        onMouseOver={() => {
                            if (disabled) {
                                setDisabled(false);
                            }
                        }}
                        onMouseOut={() => {
                            setDisabled(true);
                        }}
                        onFocus={() => {}}
                        onBlur={() => {}}
                    >
                        {isJoinedTeam ? 'Xác nhận rời nhóm' : 'Xác nhận xóa nhóm'}
                    </div>
                }
                open={deleteModalOpen}
                onOk={handleDeleteConfirm}
                onCancel={handleDeleteCancel}
                okText={isJoinedTeam ? 'Đồng ý rời' : 'Đồng ý xóa'}
                cancelText="Hủy"
                okType="danger"
                okButtonProps={{
                    danger: true,
                    className: 'hover:!bg-red-600',
                    loading: deleteLoading,
                }}
                cancelButtonProps={{
                    className: 'hover:!bg-gray-100',
                    disabled: deleteLoading,
                }}
                modalRender={(modal) => (
                    <Draggable
                        disabled={disabled}
                        bounds={bounds}
                        nodeRef={draggleRef as React.RefObject<HTMLElement>}
                        onStart={(event, uiData) => onStart(event, uiData)}
                    >
                        <div ref={draggleRef}>{modal}</div>
                    </Draggable>
                )}
            >
                <div className="space-y-4">
                    <p className="text-red-600 font-medium">
                        {isJoinedTeam
                            ? 'Bạn có chắc chắn muốn rời khỏi nhóm này?'
                            : 'Bạn có chắc chắn muốn xóa nhóm này?'}
                    </p>
                    <p className="text-gray-600">
                        {isJoinedTeam
                            ? 'Sau khi rời nhóm, bạn sẽ không thể truy cập vào các tài liệu và thông tin của nhóm. Bạn có thể được mời lại vào nhóm bởi người tạo hoặc quản trị viên.'
                            : 'Hành động này không thể hoàn tác và sẽ xóa vĩnh viễn tất cả dữ liệu liên quan đến nhóm.'}
                    </p>
                </div>
            </Modal>
        </div>
    );
};

export default Settings;
