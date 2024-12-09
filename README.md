# MMTL-Plant_disease_detection

### Introduction
The agricultural sector faces significant challenges due to the prevalence of plant diseases, which can lead to reduced crop yields and economic losses. Early and accurate disease detection is crucial for mitigating these impacts. Traditionally, plant disease detection relies on visual inspection, which is subjective, labor-intensive, and often inaccurate. While recent advancements in deep learning have enabled image-based disease detection, relying solely on visual data may limit diagnostic accuracy, especially in complex scenarios influenced by environmental or soil conditions.

To address this limitation, this project proposes a multimodal transfer learning system that leverages three complementary data sources: plant leaf images, soil characteristics, and weather data. By combining the strengths of these modalities, the system aims to enhance diagnostic accuracy and generalizability across different environments and plant species.

The proposed model incorporates a pre-trained convolutional neural network (CNN) for extracting features from leaf images and a feed-forward neural network for processing tabular data representing soil and weather conditions. These subnetworks are fused into a unified decision-making framework, leveraging transfer learning techniques to achieve state-of-the-art performance even with limited domain-specific datasets.

This approach not only enhances detection accuracy but also provides a scalable solution for real-world agricultural applications, empowering farmers and agronomists to make data-driven decisions for disease management and sustainable farming practices.

## Objective
To develop a robust multimodal transfer learning system for detecting plant diseases by integrating information from plant leaf images, soil characteristics, and weather data, thereby enabling accurate and timely disease diagnosis for improved crop management and agricultural productivity.