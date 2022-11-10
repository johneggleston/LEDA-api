import { ItemRequestDto } from '../dto/item-request.dto';
import { Item } from '../entities/item.entity';
import { DataSource, Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { Account } from '../../config/entities.config';
import { ItemStatus } from '../enums/item-status.enum';

@Injectable()
export class ItemRepository extends Repository<Item> {
  constructor(private dataSource: DataSource) {
    super(Item, dataSource.createEntityManager());
  }

  async findAll(): Promise<Item[]> {
    return this.createQueryBuilder('item')
      .select([
        'item.itemId',
        'item.tokenId',
        'item.listId',
        'item.name',
        'item.description',
        'item.price',
        'item.royalty',
        'item.likes',
        'item.status',
        'image.url',
        'item.createdAt',
        'owner.address',
        'tag.name',
        'tag.id',
      ])
      .innerJoin('item.image', 'image')
      .innerJoin('item.owner', 'owner')
      .innerJoin('item.tags', 'tag')
      .where('item.status=:status', { status: ItemStatus.Listed })
      .orderBy('item.createdAt', 'DESC')
      .getMany();
  }

  async findByAccount(accountId: string): Promise<Item[]> {
    return this.createQueryBuilder('item')
      .select([
        'item.itemId',
        'item.tokenId',
        'item.listId',
        'item.name',
        'item.description',
        'item.price',
        'item.royalty',
        'item.likes',
        'item.status',
        'image.url',
        'item.createdAt',
        'owner.accountId',
        'owner.address',
        'author.accountId',
        'author.address',
        'tag.name',
        'tag.id',
      ])
      .innerJoin('item.image', 'image')
      .innerJoin('item.owner', 'owner')
      .innerJoin('item.author', 'author')
      .innerJoin('item.tags', 'tag')
      .where('item.ownerId = :accountId OR item.authorId = :accountId', { accountId })
      .orderBy('item.createdAt', 'DESC')
      .getMany();
  }

  async findById(itemId: string): Promise<Item> {
    return this.createQueryBuilder('item')
      .select([
        'item.itemId',
        'item.tokenId',
        'item.listId',
        'item.name',
        'item.description',
        'item.price',
        'item.royalty',
        'item.likes',
        'item.status',
        'image.url',
        'item.createdAt',
        'owner.accountId',
        'owner.address',
        'author.accountId',
        'author.address',
        'tag.name',
        'tag.id',
      ])
      .innerJoin('item.image', 'image')
      .innerJoin('item.owner', 'owner')
      .innerJoin('item.author', 'author')
      .innerJoin('item.tags', 'tag')
      .where('item.itemId = :itemId', { itemId })
      .orderBy('item.createdAt', 'DESC')
      .getOne();
  }

  async listAnItem(itemId: string, listId: number, price: string): Promise<void> {
    await this.update(
      {
        itemId,
      },
      { price, listId, status: ItemStatus.Listed, updatedAt: new Date() }
    );
  }

  async delistAnItem(itemId: string): Promise<void> {
    await this.update(
      {
        itemId,
      },
      { status: ItemStatus.NotListed, updatedAt: new Date() }
    );
  }

  async buyItem(itemId: string, accountId: string): Promise<void> {
    await this.update(
      {
        itemId,
      },
      { owner: new Account(accountId), status: ItemStatus.NotListed, updatedAt: new Date() }
    );
  }

  async createItem(itemRequestDto: ItemRequestDto, account: Account): Promise<Item> {
    const { tokenId, name, collectionAddress, description, royalty, status, image, wei } =
      itemRequestDto;

    const { accountId, address } = account;

    const item = this.create({
      tokenId,
      collectionAddress,
      name,
      description,
      price: wei,
      royalty,
      status,
      image: { url: image.url, cid: image.cid },
      author: new Account(accountId),
      owner: new Account(accountId),
      createdAt: new Date(),
      updatedAt: new Date(),
      likes: 0,
    });

    await this.save(item);

    item.owner.address = address;
    item.author.address = address;

    return item;
  }
}
