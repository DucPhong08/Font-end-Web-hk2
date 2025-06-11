import React from 'react';
import { Button, Upload, List, Typography, Input } from 'antd';
import { UploadOutlined, PaperClipOutlined, DeleteOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { TaskNotesAndAttachments } from '@services/types/types';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const { TextArea } = Input;
const { Text } = Typography;

interface NotesAndAttachmentsProps {
    notesAndAttachments: TaskNotesAndAttachments[];
    newNote: string;
    newFile: File | null;
    loading: boolean;
    onNoteChange: (value: string) => void;
    onFileChange: (info: any) => void;
    onAddNoteAndFile: () => void;
    onDeleteNote: (id: number) => void;
    onRemoveFile: () => void;
    onFileSizeError: () => void;
}

const NotesAndAttachments = ({
    notesAndAttachments,
    newNote,
    newFile,
    loading,
    onNoteChange,
    onFileChange,
    onAddNoteAndFile,
    onDeleteNote,
    onRemoveFile,
    onFileSizeError,
}: NotesAndAttachmentsProps) => {
    const formatFileSize = (bytes: number | null | undefined): string => {
        if (!bytes) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
    };

    return (
        <div className="space-y-6 flex flex-col">
            <div>
                <h3 className="text-lg font-semibold mb-4 text-gray-800">Danh sách ghi chú và tệp đính kèm</h3>
                {notesAndAttachments.length > 0 ? (
                    <List
                        dataSource={notesAndAttachments.slice().reverse()} // đảo ngược mảng
                        renderItem={(item) => (
                            <List.Item
                                actions={[
                                    <Button
                                        key="delete"
                                        type="text"
                                        danger
                                        icon={<DeleteOutlined />}
                                        onClick={() => onDeleteNote(item.id)}
                                        loading={loading}
                                    />,
                                ]}
                            >
                                <div className="w-full">
                                    {item.content && (
                                        <p className="text-gray-800 whitespace-pre-wrap mb-2">{item.content}</p>
                                    )}
                                    {item.file_url && (
                                        <div className="flex items-center gap-2">
                                            <PaperClipOutlined className="text-gray-400" />
                                            <a
                                                href={item.file_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-600 hover:text-blue-800"
                                            >
                                                {item.file_name}
                                            </a>
                                            <Text type="secondary" className="text-sm">
                                                ({formatFileSize(item.file_size)})
                                            </Text>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2 mt-2">
                                        <Text type="secondary" className="text-sm">
                                            {dayjs(item.created_at).format('DD/MM/YYYY HH:mm')}
                                        </Text>
                                        {item.updated_at !== item.created_at && (
                                            <Text type="secondary" className="text-sm">
                                                (Đã chỉnh sửa)
                                            </Text>
                                        )}
                                    </div>
                                </div>
                            </List.Item>
                        )}
                    />
                ) : (
                    <div className="text-center py-8 border border-dashed border-gray-200 rounded-lg">
                        <PaperClipOutlined className="text-4xl text-gray-400 mb-2" />
                        <p className="text-gray-500">Chưa có ghi chú và tệp đính kèm nào</p>
                        <p className="text-gray-400 text-sm mt-1">
                            Thêm ghi chú hoặc tệp đính kèm để theo dõi công việc
                        </p>
                    </div>
                )}
            </div>

            {/* Ô thêm ghi chú và tệp đính kèm (Đưa xuống dưới cùng) */}
            <div>
                <h3 className="text-lg font-semibold mb-4 text-gray-800">Thêm ghi chú và tệp đính kèm</h3>
                <div className="space-y-4">
                    <div className="flex flex-col">
                        <div className="w-full">
                            <ReactQuill
                                value={newNote}
                                onChange={onNoteChange}
                                theme="snow"
                                className="bg-white border border-gray-300 rounded-md"
                                style={{ minHeight: '120px', maxHeight: '200px', overflowY: 'auto' }}
                            />
                            <div className="text-right text-sm text-gray-500 mt-1">
                                {newNote.replace(/<[^>]+>/g, '').length}/500 ký tự
                            </div>
                        </div>
                        <div className="flex items-center gap-4 mb-2">
                            <Upload
                                customRequest={({ onSuccess }) => setTimeout(() => onSuccess?.('ok'), 0)}
                                onChange={onFileChange}
                                showUploadList={false}
                                accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                                beforeUpload={(file) => {
                                    const isLt10M = file.size / 1024 / 1024 < 10;
                                    if (!isLt10M) {
                                        onFileSizeError();
                                        return false;
                                    }
                                    return true;
                                }}
                            >
                                <Button icon={<UploadOutlined />}>Chọn tệp</Button>
                            </Upload>
                            {newFile && (
                                <div className="flex items-center gap-2">
                                    <PaperClipOutlined />
                                    <span className="text-sm text-gray-600">{newFile.name}</span>
                                    <Button type="text" danger icon={<DeleteOutlined />} onClick={onRemoveFile} />
                                </div>
                            )}
                        </div>
                        <Button
                            type="primary"
                            onClick={onAddNoteAndFile}
                            loading={loading}
                            disabled={!newNote.trim() && !newFile}
                            className="w-full"
                        >
                            Thêm
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NotesAndAttachments;
