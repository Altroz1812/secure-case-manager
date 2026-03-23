export interface ReportBlock {
  id: string;
  type: BlockType;
  config: Record<string, any>;
}

export type BlockType =
  | 'header'
  | 'client_logo'
  | 'section_title'
  | 'key_value_table'
  | 'data_table'
  | 'text_block'
  | 'photo_grid'
  | 'signature_block'
  | 'spacer'
  | 'divider';

export interface TemplateConfig {
  pageSize: 'A4' | 'Letter';
  orientation: 'portrait' | 'landscape';
  margins: { top: number; right: number; bottom: number; left: number };
  blocks: ReportBlock[];
}

export const BLOCK_TYPE_META: Record<BlockType, { label: string; icon: string; description: string }> = {
  header: { label: 'Header', icon: 'FileText', description: 'Report title, subtitle, date' },
  client_logo: { label: 'Client Logo', icon: 'Image', description: 'Client logo with position/size' },
  section_title: { label: 'Section Title', icon: 'Heading', description: 'Section heading with divider' },
  key_value_table: { label: 'Key-Value Table', icon: 'Table2', description: 'Label-value pairs layout' },
  data_table: { label: 'Data Table', icon: 'Grid3X3', description: 'Multi-column dynamic table' },
  text_block: { label: 'Text Block', icon: 'AlignLeft', description: 'Paragraph/remarks content' },
  photo_grid: { label: 'Photo Grid', icon: 'Camera', description: 'Evidence photos grid' },
  signature_block: { label: 'Signature Block', icon: 'PenLine', description: 'Signature lines' },
  spacer: { label: 'Spacer', icon: 'Space', description: 'Vertical spacing' },
  divider: { label: 'Divider', icon: 'Minus', description: 'Horizontal rule' },
};

export const AVAILABLE_FIELDS = [
  '{{applicant_name}}',
  '{{application_number}}',
  '{{loan_number}}',
  '{{address}}',
  '{{pincode}}',
  '{{client_name}}',
  '{{client_code}}',
  '{{product_name}}',
  '{{branch_name}}',
  '{{verification_type}}',
  '{{verification_date}}',
  '{{verifier_name}}',
  '{{verifier_code}}',
  '{{task_number}}',
  '{{lead_number}}',
  '{{status}}',
  '{{checklist_results}}',
  '{{observation_tags}}',
  '{{remarks}}',
  '{{qc_remarks}}',
  '{{evidence_photos}}',
  '{{geo_coordinates}}',
  '{{report_date}}',
  '{{sla_deadline}}',
];

export function createDefaultBlock(type: BlockType): ReportBlock {
  const id = crypto.randomUUID();
  const defaults: Record<BlockType, Record<string, any>> = {
    header: { title: 'Verification Report', subtitle: '{{client_name}}', showDate: true, showLogo: true, logoPosition: 'left' },
    client_logo: { position: 'center', width: 120, height: 60 },
    section_title: { title: 'Section Title', showDivider: true, align: 'left' },
    key_value_table: {
      title: '',
      columns: 2,
      fields: [
        { label: 'Name', field: '{{applicant_name}}' },
        { label: 'Application No.', field: '{{application_number}}' },
      ],
    },
    data_table: {
      title: '',
      headers: ['Sr. No.', 'Field', 'Value'],
      rowSource: 'checklist_results',
    },
    text_block: { content: '', field: '{{remarks}}', fontSize: 12 },
    photo_grid: { columns: 3, showCaptions: true, showGeoTag: true, field: '{{evidence_photos}}' },
    signature_block: {
      signatures: [
        { label: 'Verified By', name: '{{verifier_name}}', designation: 'Field Executive' },
        { label: 'Reviewed By', name: '', designation: 'QC Manager' },
      ],
    },
    spacer: { height: 20 },
    divider: { style: 'solid', color: '#e2e8f0', thickness: 1 },
  };
  return { id, type, config: defaults[type] };
}

// Presets
export const PRESETS: Record<string, { label: string; description: string; blocks: ReportBlock[] }> = {
  fi: {
    label: 'FI – Field Investigation',
    description: 'Residence/business visit with photo evidence',
    blocks: [
      createDefaultBlock('header'),
      { ...createDefaultBlock('section_title'), config: { title: 'Applicant Details', showDivider: true, align: 'left' } },
      {
        ...createDefaultBlock('key_value_table'),
        config: {
          title: '', columns: 2,
          fields: [
            { label: 'Applicant Name', field: '{{applicant_name}}' },
            { label: 'Application No.', field: '{{application_number}}' },
            { label: 'Address', field: '{{address}}' },
            { label: 'Pincode', field: '{{pincode}}' },
            { label: 'Product', field: '{{product_name}}' },
            { label: 'Branch', field: '{{branch_name}}' },
          ],
        },
      },
      { ...createDefaultBlock('section_title'), config: { title: 'Verification Details', showDivider: true, align: 'left' } },
      {
        ...createDefaultBlock('key_value_table'),
        config: {
          title: '', columns: 2,
          fields: [
            { label: 'Verification Type', field: '{{verification_type}}' },
            { label: 'Task Number', field: '{{task_number}}' },
            { label: 'Status', field: '{{status}}' },
            { label: 'Verification Date', field: '{{verification_date}}' },
            { label: 'FE Name', field: '{{verifier_name}}' },
            { label: 'FE Code', field: '{{verifier_code}}' },
          ],
        },
      },
      { ...createDefaultBlock('section_title'), config: { title: 'Checklist', showDivider: true, align: 'left' } },
      { ...createDefaultBlock('data_table'), config: { title: '', headers: ['Sr. No.', 'Check Item', 'Response'], rowSource: 'checklist_results' } },
      { ...createDefaultBlock('section_title'), config: { title: 'Observations & Remarks', showDivider: true, align: 'left' } },
      { ...createDefaultBlock('text_block'), config: { content: '', field: '{{remarks}}', fontSize: 12 } },
      { ...createDefaultBlock('section_title'), config: { title: 'Photo Evidence', showDivider: true, align: 'left' } },
      createDefaultBlock('photo_grid'),
      createDefaultBlock('divider'),
      createDefaultBlock('signature_block'),
    ],
  },
  cpv: {
    label: 'CPV – Contact Point Verification',
    description: 'Phone/contact verification report',
    blocks: [
      createDefaultBlock('header'),
      { ...createDefaultBlock('section_title'), config: { title: 'Applicant Information', showDivider: true, align: 'left' } },
      {
        ...createDefaultBlock('key_value_table'),
        config: {
          title: '', columns: 2,
          fields: [
            { label: 'Applicant Name', field: '{{applicant_name}}' },
            { label: 'Application No.', field: '{{application_number}}' },
            { label: 'Phone', field: '{{applicant_phone}}' },
            { label: 'Address', field: '{{address}}' },
          ],
        },
      },
      { ...createDefaultBlock('section_title'), config: { title: 'Verification Summary', showDivider: true, align: 'left' } },
      { ...createDefaultBlock('data_table'), config: { title: '', headers: ['Sr. No.', 'Check Item', 'Response'], rowSource: 'checklist_results' } },
      { ...createDefaultBlock('section_title'), config: { title: 'Remarks', showDivider: true, align: 'left' } },
      { ...createDefaultBlock('text_block'), config: { content: '', field: '{{remarks}}', fontSize: 12 } },
      createDefaultBlock('signature_block'),
    ],
  },
  bgv: {
    label: 'BGV – Background Verification',
    description: 'Employment, education, criminal checks',
    blocks: [
      createDefaultBlock('header'),
      { ...createDefaultBlock('section_title'), config: { title: 'Candidate Details', showDivider: true, align: 'left' } },
      {
        ...createDefaultBlock('key_value_table'),
        config: {
          title: '', columns: 2,
          fields: [
            { label: 'Name', field: '{{applicant_name}}' },
            { label: 'Application No.', field: '{{application_number}}' },
            { label: 'Employer', field: '{{employer_name}}' },
            { label: 'Designation', field: '{{designation}}' },
          ],
        },
      },
      { ...createDefaultBlock('section_title'), config: { title: 'Verification Checklist', showDivider: true, align: 'left' } },
      { ...createDefaultBlock('data_table'), config: { title: '', headers: ['Sr. No.', 'Check Item', 'Response'], rowSource: 'checklist_results' } },
      { ...createDefaultBlock('section_title'), config: { title: 'Observations', showDivider: true, align: 'left' } },
      { ...createDefaultBlock('text_block'), config: { content: '', field: '{{remarks}}', fontSize: 12 } },
      createDefaultBlock('divider'),
      createDefaultBlock('signature_block'),
    ],
  },
  itr: {
    label: 'ITR – Income Verification',
    description: 'Income tax return and financial verification',
    blocks: [
      createDefaultBlock('header'),
      { ...createDefaultBlock('section_title'), config: { title: 'Applicant Details', showDivider: true, align: 'left' } },
      {
        ...createDefaultBlock('key_value_table'),
        config: {
          title: '', columns: 2,
          fields: [
            { label: 'Name', field: '{{applicant_name}}' },
            { label: 'PAN', field: '{{pan_number}}' },
            { label: 'Application No.', field: '{{application_number}}' },
            { label: 'Loan No.', field: '{{loan_number}}' },
          ],
        },
      },
      { ...createDefaultBlock('section_title'), config: { title: 'Income Verification', showDivider: true, align: 'left' } },
      { ...createDefaultBlock('data_table'), config: { title: '', headers: ['Sr. No.', 'Check Item', 'Response'], rowSource: 'checklist_results' } },
      { ...createDefaultBlock('section_title'), config: { title: 'Remarks', showDivider: true, align: 'left' } },
      { ...createDefaultBlock('text_block'), config: { content: '', field: '{{remarks}}', fontSize: 12 } },
      createDefaultBlock('signature_block'),
    ],
  },
};
