import React, { useEffect, useState } from 'react';
import { Modal, Avatar, Descriptions, Spin, Tag } from 'antd';
import { UserProfile } from '@services/types/types';
import type { TeamMemberInfo } from '@services/teamServices/teamMembers/getMembersTeam';
import getProfileOtherUserByNameEmail from '@services/userServices/getProfileOtherUserByName&Email';
import { useMessage } from '@hooks/useMessage';
import { ROLES } from '@common/constant';

interface MemberProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    member: TeamMemberInfo | null;
}

const MemberProfileModal: React.FC<MemberProfileModalProps> = ({ isOpen, onClose, member }) => {
    const [loading, setLoading] = useState(false);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const { message } = useMessage();

    useEffect(() => {
        const fetchProfile = async () => {
            if (!member?.id) return;
            try {
                setLoading(true);
                const data = await getProfileOtherUserByNameEmail(member.id.toString());
                setProfile(data);
            } catch (error) {
                message.error({
                    key: 'fetch-profile-error',
                    content: 'Không thể tải thông tin người dùng',
                });
            } finally {
                setLoading(false);
            }
        };

        if (isOpen && member) {
            fetchProfile();
        }
    }, [member, isOpen, message]);

    const getRoleTag = (role: string) => {
        switch (role) {
            case ROLES.CREATOR:
                return <Tag color="purple">Người tạo</Tag>;
            case ROLES.ADMIN:
                return <Tag color="blue">Quản trị viên</Tag>;
            case ROLES.MEMBER:
                return <Tag color="green">Thành viên</Tag>;
            default:
                return <Tag color="default">{role}</Tag>;
        }
    };

    const getStatusTag = (status: string) => {
        switch (status) {
            case 'active':
                return <Tag color="success">Hoạt động</Tag>;
            case 'locked':
                return <Tag color="warning">Đã khóa</Tag>;
            case 'banned':
                return <Tag color="error">Đã cấm</Tag>;
            default:
                return <Tag color="default">{status}</Tag>;
        }
    };

    const getGenderText = (gender: string) => {
        switch (gender) {
            case 'male':
                return 'Nam';
            case 'female':
                return 'Nữ';
            case 'other':
                return 'Khác';
            default:
                return gender;
        }
    };

    if (!member) return null;

    return (
        <Modal
            title="Thông tin thành viên"
            open={isOpen}
            onCancel={onClose}
            footer={null}
            width="90%"
            style={{ maxWidth: '600px' }}
            className="member-profile-modal"
            centered
        >
            {loading ? (
                <div className="flex justify-center items-center h-40">
                    <Spin size="large" />
                </div>
            ) : profile ? (
                <div className="space-y-4 md:space-y-6">
                    <div className="flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-4">
                        <Avatar size={80} src={member.avatar_url} className="border-2 border-gray-200">
                            {member.full_name?.[0]?.toUpperCase() || '?'}
                        </Avatar>
                        <div className="text-center md:text-left">
                            <h3 className="text-xl font-semibold break-words">{member.full_name}</h3>
                            <p className="text-gray-500 break-all">{profile.email}</p>
                            <div className="mt-2 space-x-2 flex flex-wrap justify-center md:justify-start gap-2">
                                {getRoleTag(member.role)}
                                {getStatusTag(profile.status || '')}
                            </div>
                        </div>
                    </div>

                    <Descriptions
                        bordered
                        column={1}
                        className="bg-white"
                        size="small"
                        labelStyle={{
                            width: '120px',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                        }}
                    >
                        <Descriptions.Item label="ID">{member.id}</Descriptions.Item>
                        <Descriptions.Item label="Email">
                            <span className="font-medium text-blue-600 break-all">{profile.email}</span>
                        </Descriptions.Item>
                        <Descriptions.Item label="Chức vụ trong nhóm">
                            {member.role === ROLES.CREATOR
                                ? 'Người tạo'
                                : member.role === ROLES.ADMIN
                                  ? 'Quản trị viên'
                                  : 'Thành viên'}
                        </Descriptions.Item>
                        <Descriptions.Item label="Trạng thái">
                            {profile.status === 'active' ? 'Hoạt động' : 'Không hoạt động'}
                        </Descriptions.Item>
                        {profile.phone_number && (
                            <Descriptions.Item label="Số điện thoại">
                                <span className="break-all">{profile.phone_number}</span>
                            </Descriptions.Item>
                        )}
                        {profile.gender && (
                            <Descriptions.Item label="Giới tính">{getGenderText(profile.gender)}</Descriptions.Item>
                        )}
                        {profile.date_of_birth && (
                            <Descriptions.Item label="Ngày sinh">
                                {new Date(profile.date_of_birth).toLocaleDateString('vi-VN', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                })}
                            </Descriptions.Item>
                        )}
                        {profile.address && (
                            <Descriptions.Item label="Địa chỉ">
                                <span className="break-words">{profile.address}</span>
                            </Descriptions.Item>
                        )}
                        {profile.bio && (
                            <Descriptions.Item label="Giới thiệu">
                                <div className="whitespace-pre-wrap break-words">{profile.bio}</div>
                            </Descriptions.Item>
                        )}
                    </Descriptions>
                </div>
            ) : (
                <div className="text-center text-gray-500">Không tìm thấy thông tin</div>
            )}
        </Modal>
    );
};

export default MemberProfileModal;
